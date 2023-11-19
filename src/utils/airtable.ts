import Airtable from "airtable";

var airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

export default airtable(process.env.AIRTABLE_TABLE_ID);
