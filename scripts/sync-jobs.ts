import "dotenv/config";

import { syncJobs } from "../src/lib/jobs/sync-jobs";

async function main() {
  const result = await syncJobs();
  console.log(JSON.stringify(result, null, 2));

  if (result.status === "error") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
