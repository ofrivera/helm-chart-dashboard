import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import yaml from 'js-yaml';
import fs from 'fs/promises';
import express from 'express';
import semver from 'semver';
import dotenv from 'dotenv';
import config from 'config';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const REPO_CHART_PATH = process.env.REPO_CHART_PATH
const CHARTS_PATH = path.join(__dirname, REPO_CHART_PATH);

app.use(cors());

async function parseChartYaml(filePath) {
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = yaml.load(fileContents);
    return {
      name: data.name,
      version: data.version,
      dependencies: data.dependencies || []
    };
  } catch (e) {
    console.log(`Error parsing ${filePath}:`, e);
    return null;
  }
}
async function aggregateChartData(directoryPath) {
  const chartData = {};
  const output = [];

  async function processDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      const relativePath = path.relative(CHARTS_PATH, fullPath);

      const fullPathUrl = `${process.env.REPO_TREE_PATH}/${REPO_CHART_PATH}/${relativePath}`;
      output.push(fullPathUrl);
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.name === 'Chart.yaml') {
        output.push(`Processing Chart.yaml: ${fullPath}`);
        try {
          const chart = await parseChartYaml(fullPath);
          if (chart) {
            chart.dependencies.forEach(dep => {
              const key = `${dep.name}|${dep.version}|${dep.repository}`;
              if (!chartData[key]) {
                chartData[key] = {
                  name: dep.name,
                  version: dep.version,
                  repository: dep.repository,
                  count: 0,
                  items: []
                };
              }
              chartData[key].count++;
              chartData[key].items.push(fullPathUrl);
            });
          }
        } catch (error) {
          output.push(`Error processing ${fullPath}: ${error}`);
        }
      }
    }
  }

  await processDirectory(directoryPath);
  return { chartData: Object.values(chartData), output };
}

app.get('/api/charts', async (req, res) => {
  try {
    const { chartData, output } = await aggregateChartData(CHARTS_PATH);
    console.log(output.join('\n'));

    const inHouseChartsArray = [];
    const externalChartsArray = [];
    const inHouseCharts = config.get('inHouseCharts');
    output.push(`In-house charts: ${inHouseCharts}`);

    const sortedData = chartData.sort((a, b) => {
      const nameComparison = a.name.localeCompare(b.name);
      if (nameComparison !== 0) {
        return nameComparison;
      }

      const versionA = semver.valid(semver.coerce(a.version));
      const versionB = semver.valid(semver.coerce(b.version));

      if (versionA && versionB) {
        const comparison = semver.rcompare(versionA, versionB);
        if (comparison !== 0) return comparison;
      }

      return semver.rcompare(a.version, b.version);
    });

    sortedData.forEach(chart => {
      if (inHouseCharts.includes(chart.name)) {
        inHouseChartsArray.push(chart);
      } else {
        externalChartsArray.push(chart);
      }
    });

    res.json({ inHouseChartsArray, externalChartsArray, log: output });
  } catch (error) {
    console.error('Error processing charts:', error);
    res.status(500).json({ error: 'An error occurred while processing the charts.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});