import axios from "axios";
import lookup from "coordinate_to_country";
import fs from "fs";

let venues = [];
let processedCount = 0;
let lightProcessedCount = 0;
const usAtms = [];
const lightUsAtms = [];

interface LightATM {
  id: number | null;
  lat: number | null;
  lon: number | null;
  category: string | null;
  name: string | null;
  created_on: number | null;
  geolocation_degrees: string | null;
}

interface ATM {
  lat: number | null;
  postcode: string | null;
  email: string | null;
  created_on: number | null;
  lon: number | null;
  state: string | null;
  phone: string | null;
  updated_on: number | null;
  category: string | null;
  country: string | null;
  fax: number | null;
  name: string | null;
  website: string | null;
  logo_url: string | null;
  name_ascii: string | null;
  facebook: string | null;
  description: string | null;
  id: number | null;
  street: string | null;
  twitter: string | null;
  instagram: string | null;
  city: string | null;
  coins: [];
  geolocation_degrees: string | null;
}

axios
  .get("https://coinmap.org/api/v1/venues/")
  .then((res) => {
    // console.log(res);
    // console.log(res.data.venues);
    venues = res.data.venues;
    console.log("The total number of venues", venues.length);
    console.log(venues);
    // processLightVenues();
    processVenues();
  })
  .catch((err) => console.log(err));

const processLightVenues = () => {
  let startTime = Date.now();
  for (let venue of venues) {
    const countries: string[] = lookup(venue.lat, venue.lon);
    if (countries.includes("USA")) {
      const atm: LightATM = parseLightATM(venue);
      //   console.log(atm);
      lightUsAtms.push(atm);
    }
    lightProcessedCount++;
    if (lightProcessedCount % 100 === 0) {
      console.log(
        `Processed ${lightProcessedCount} of ${
          venues.length
        } venues. Estimated Finish time ${estimatedFinishTime(
          startTime,
          venues.length,
          lightProcessedCount
        )}`
      );
    }
  }

  console.log("Total US ATMS");
  console.log(lightUsAtms.length);

  const csv = jsonToCsv(lightUsAtms);
  fs.writeFile("us-atms-light.csv", csv, "utf8", function (err) {
    if (err) {
      console.log(
        "Some error occured - file either not saved or corrupted file saved."
      );
    } else {
      console.log("It's saved!");
    }
  });
};

const processVenues = async () => {
  let currentTime = Date.now();
  for (let venue of venues) {
    if (processedCount === 200) {
      break;
    }
    // console.log("Fetching venue", venue.id);
    try {
      //   console.log(venue.lat, venue.lon);
      const countries: string[] = lookup(venue.lat, venue.lon);
      if (countries.includes("USA")) {
        const result = await axios.get(
          `https://coinmap.org/api/v1/venues/${venue.id}`
        );
        // console.log("Another venue");
        console.log(result.data);
        const atm: ATM = parseATM(result.data);
        console.log("parsed ATM!!!");
        console.log(atm);
        usAtms.push(atm);
      }
    } catch (error) {
      console.log("error!!");
      console.log(error);
    }
    processedCount++;
    if (processedCount % 100 === 0) {
      console.log(
        `Processed ${processedCount} of ${
          venues.length
        } venues. Estimated Finish time ${estimatedFinishTime(
          currentTime,
          venues.length,
          processedCount
        )}`
      );
    }
  }

  console.log("All the US ATMS!!!");
  console.log(usAtms);

  const csv = jsonToCsv(usAtms);
  fs.writeFile("us-atms.csv", csv, "utf8", function (err) {
    if (err) {
      console.log(
        "Some error occured - file either not saved or corrupted file saved."
      );
    } else {
      console.log("It's saved!");
    }
  });
};

const estimatedFinishTime = (
  start: number,
  total: number,
  processedCount: number
) => {
  const elapsed = Date.now() - start;
  const percentComplete = processedCount / total;
  const totalTime = elapsed * (1 / percentComplete);
  const endTimeStamp = start + totalTime;
  return new Date(endTimeStamp).toLocaleString();
};

const parseLightATM = (res: any): LightATM => {
  return {
    lat: res?.lat ?? null,
    created_on: res?.created_on ?? null,
    lon: res?.lon ?? null,
    category: res?.category ?? null,
    name: res?.name ?? null,
    id: res?.id ?? null,
    geolocation_degrees: res?.geolocation_degrees ?? null,
  };
};

const parseATM = (resFull: any): ATM => {
  const res = resFull?.venue;
  return {
    lat: res?.lat ?? null,
    postcode: res?.postcode ?? null,
    email: res?.email ?? null,
    created_on: res?.created_on ?? null,
    lon: res?.lon ?? null,
    state: res?.state ?? null,
    phone: res?.phone ?? null,
    updated_on: res?.updated_on ?? null,
    category: res?.category ?? null,
    country: res?.country ?? null,
    fax: res?.fax ?? null,
    name: res?.name ?? null,
    website: res?.logo_url ?? null,
    logo_url: res?.logo_url ?? null,
    name_ascii: res?.name_ascii ?? null,
    facebook: res?.facebook ?? null,
    description: res?.description ?? null,
    id: res?.id ?? null,
    street: res?.street ?? null,
    twitter: res?.twitter ?? null,
    instagram: res?.instagram ?? null,
    city: res?.city ?? null,
    coins: res?.coins ?? [],
    geolocation_degrees: res?.geolocation_degrees ?? null,
  };
};

function jsonToCsv(jsonData) {
  let csv = "";
  // Get the headers
  let headers = Object.keys(jsonData[0]);
  csv += headers.join("\t") + "\n";
  // Add the data
  jsonData.forEach(function (row) {
    let data = headers.map((header) => JSON.stringify(row[header])).join("\t"); // Add JSON.stringify statement
    csv += data + "\n";
  });
  return csv;
}
