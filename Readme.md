# ServisBOT Backup Status Page

This is a **backup status page** for ServisBOT services, hosted on GitHub Pages.  
It is designed to be used **if the main Atlassian status page goes down**.  

The page displays:

- Overall company status (banner at the top)  
- Service status per region (green/orange/red)  
- Timeline of recent incidents  
- Support contact email  

---

## 1. How it works

### Status data

The page uses a JSON file (`status.json`) as the source of truth.  
Example structure:

```json
{
  "status": "OPERATIONAL",
  "timestamp": "2025-11-05T09:05:35.033Z",
  "contact": "support@servisbot.com",
  "affected_regions": [
    {
      "region_name": "us-1",
      "services": [
        {
          "name": "tcp",
          "status": "OK",
          "lastChecked": "2025-11-05T09:05:35.032Z"
        },
        {
          "name": "core",
          "status": "OK",
          "lastChecked": "2025-11-05T09:05:35.033Z"
        }
      ]
    },
    {
      "region_name": "eu-1",
      "services": [
        {
          "name": "tcp",
          "status": "OK",
          "lastChecked": "2025-11-05T09:05:35.033Z"
        },
        {
          "name": "core",
          "status": "OK",
          "lastChecked": "2025-11-05T09:05:35.033Z"
        }
      ]
    },
    {
      "region_name": "eu-2",
      "services": [
        {
          "name": "tcp",
          "status": "OK",
          "lastChecked": "2025-11-05T09:05:35.033Z"
        },
        {
          "name": "core",
          "status": "OK",
          "lastChecked": "2025-11-05T09:05:35.033Z"
        }
      ]
    }
  ],
  "timeline": [
    {
      "time": "2025-11-03T22:40:38.327Z",
      "status": "Overall status changed from OPERATIONAL to DOWN"
    },
    {
      "time": "2025-11-05T09:05:35.033Z",
      "status": "Overall status changed from DOWN to OPERATIONAL"
    }
  ]
}



## Notes

**status** → overall company status (`OPERATIONAL`, `DEGRADED`, `DOWN`)  
**affected_regions** → each region and its services  
**timeline** → recent events  
**contact** → support email shown on the page  


## 2. Understanding per-region and overall status

### Service-level status

Each region contains services with a `status`:

| Status   | Color on page | Meaning                     |
|----------|---------------|-----------------------------|
| OK       | Green         | Service is fully operational |
| DEGRADED | Orange        | Service is partially impaired |
| DOWN     | Red           | Service is not functioning  |

Example per-region view:

| Region | tcp | core |
|--------|-----|------|
| us-1   | OK  | DEGRADED |
| eu-1   | DOWN | DEGRADED |
| eu-2   | OK  | OK |



### Region-level status

The region status is calculated as the **worst service status in that region**:

- Any service DOWN → region is DOWN  
- Otherwise, any service DEGRADED → region is DEGRADED  
- All services OK → region is OK

Example:

| Region | Computed status |
|--------|----------------|
| us-1   | DEGRADED       |
| eu-1   | DOWN           |
| eu-2   | OK             |



### Overall headline (page banner)

The overall headline shows the **worst status across all regions and services**:

| Worst service status       | Overall headline           | Color  |
|----------------------------|---------------------------|--------|
| Any service DOWN           | Major Outage             | Red    |
| No DOWN, any DEGRADED      | Some Systems Degraded    | Orange |
| All services OK            | All Systems Operational  | Green  |

Using the example above, the headline will display:


because `eu-1 tcp` is DOWN.



## 3. Viewing the page locally

1. Install Node.js (v20+ recommended).  
2. From the repo root, start a local server:

```bash
npx http-server -c-1 .


## 4. Manually updating the status page

1. Open `status.json` in a text editor.

2. Update fields as needed:

**Overall status**:

```json
"status": "DOWN"

3. Run checkStatus.js

```bash
node checkStatus.js

## 5. Deploying to GitHub Pages

1. Commit your changes:

```bash
git add status.json
git commit -m "Update status page manually"
git push origin main
