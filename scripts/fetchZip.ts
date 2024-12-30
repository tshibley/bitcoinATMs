import * as fs from "fs";
import geo from "geocodio-library-node";

const geocoder = new geo("9c16b33b6a9747c0984ba91a1a9a7049673a0c9");
const batchSize = 500;

function loadTSV(filePath: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const rows = data.split("\n");
      const result: string[][] = [];

      for (const row of rows) {
        const columns = row.split("\t");
        result.push(columns);
      }

      resolve(result);
    });
  });
}

async function main() {
  try {
    const data = await loadTSV("./us-atms-light.csv");
    // console.log(data);
    // fetchAddressFromLatLon(data[1][0], data[1][2]);
    // console.log(data[0]);
    data[0].push(...["zip", "address"]);
    // console.log(data[0]);

    // data.splice(505, 100000);

    let startIndex = 1;
    // go through each Batch
    while (startIndex < data.length) {
      let endIndex = Math.min(startIndex + 500, data.length);
      console.log("Doing the loop", startIndex, endIndex);
      // get the latLongs for theses items

      //build the input
      const input = [];
      for (let i = startIndex; i < endIndex; i++) {
        input.push(`${data[i][0]}, ${data[i][2]}`);
      }

      // make the request
      const result = await fetchAddressFromLatLon(input);
      //   console.log("The result up here");
      //   console.log(JSON.stringify(result));
      const values = result.results;

      // format the output
      for (let i = startIndex; i < endIndex; i++) {
        let currResultIndex = i - startIndex;
        const next = values[currResultIndex];
        const query = next.query;
        const add = next.response.results[0];
        if (!add) {
          console.log("Not found");
          console.log(query);
          console.log(JSON.stringify(next));
        }
        // console.log("The query", query);
        // console.log("The result", JSON.stringify(add));
        data[i].push(...[add?.address_components?.zip, add?.formatted_address]);
      }

      startIndex = endIndex;
    }

    const csv = arrayToCsv(data);
    fs.writeFile("us-atms-with-zip.csv", csv, "utf8", function (err) {
      if (err) {
        console.log(
          "Some error occured - file either not saved or corrupted file saved."
        );
      } else {
        console.log("It's saved!");
      }
    });
  } catch (err) {
    console.error(err);
  }
}

async function fetchAddressFromLatLon(coords: string[]): Promise<any> {
  try {
    // console.log("cooredinats");
    // console.log(`${lat},${lon}`);
    const result = await geocoder.reverse(coords, [], 1);
    // console.log("result!!!!!!");
    // console.log(result.results[0]);
    // console.log(JSON.stringify(result));
    return result;
  } catch (error) {
    console.log("error :(");
    console.log(error);
  }
  return null;
}

function arrayToCsv(data: string[][]): string {
  let csv = "";
  // Get the headers
  //   let headers = data[0];
  //   csv += headers.join("\t") + "\n";
  // Add the data
  data.forEach(function (row) {
    // let data = headers.map((header) => JSON.stringify(row[header])).join("\t"); // Add JSON.stringify statement
    csv += row.join("\t") + "\n";
    // csv += data + "\n";
  });
  return csv;
}
main();
