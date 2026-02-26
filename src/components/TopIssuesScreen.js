import React, { useMemo } from "react";
import {
  qcFailures,
  stockMismatch,
  dispatchLogs,
  routeIssues
} from "../data";

export default function TopIssuesScreen({ onBack }) {
  const rows = useMemo(() => {
    const all = [];

    qcFailures.forEach(r => {
      all.push({
        exception_type: "QC_FAILURE",
        reference_id: r.id,
        warehouse: r.warehouse,
        created_at: r.created_at
      });
    });

    stockMismatch.forEach(r => {
      all.push({
        exception_type: "STOCK_MISMATCH",
        reference_id: r.id,
        warehouse: r.warehouse,
        created_at: r.created_at
      });
    });

    dispatchLogs.forEach(r => {
      all.push({
        exception_type: "DISPATCH_LOGS",
        reference_id: r.id,
        warehouse: r.warehouse,
        created_at: r.created_at
      });
    });

    routeIssues.forEach(r => {
      all.push({
        exception_type: "ROUTE_ISSUES",
        reference_id: r.id,
        warehouse: r.route_id || "N/A",
        created_at: r.created_at
      });
    });

    const byKey = new Map();

    all.forEach(item => {
      const key = `${item.exception_type}::${item.warehouse}`;
      const current = byKey.get(key) || {
        exception_type: item.exception_type,
        warehouse: item.warehouse,
        score: 0,
        latest_created_at: item.created_at
      };
      current.score += 1;
      if (new Date(item.created_at) > new Date(current.latest_created_at)) {
        current.latest_created_at = item.created_at;
      }
      byKey.set(key, current);
    });

    const aggregated = Array.from(byKey.values()).sort(
      (a, b) => b.score - a.score
    );

    return aggregated.slice(0, 10).map((item, index) => ({
      id: index + 1,
      ...item,
      rank: index + 1
    }));
  }, []);

  return (
    <div className="category-screen">
      <button onClick={onBack}>⬅ Back</button>
      <h2>Daily Top 10 Issues</h2>
      <p style={{ marginBottom: 16, fontSize: 13, color: "#4b5563" }}>
        Aggregated view of the most frequent exceptions across QC, stock,
        dispatch, and route modules.
      </p>

      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Exception Type</th>
            <th>Warehouse / Route</th>
            <th>Score</th>
            <th>Latest Occurrence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td>{row.rank}</td>
              <td>{row.exception_type}</td>
              <td>{row.warehouse}</td>
              <td>{row.score}</td>
              <td>{row.latest_created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

