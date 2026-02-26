import React, { useState } from "react";
import {
  qcFailures,
  stockMismatch,
  dispatchLogs,
  routeIssues
} from "../data";
import StatusBadge from "./StatusBadge";
import Toast from "./Toast";

const CATEGORY_CONFIG = {
  QC_FAILURE: {
    label: "QC Failures",
    statusOptions: ["OPEN", "ACTION_TAKEN", "CLOSED"],
    columns: [
      "id",
      "item_id",
      "item_name",
      "item_brand",
      "qr_id",
      "batch_id",
      "expiry_date",
      "variety",
      "qty",
      "reason",
      "warehouse",
      "created_by",
      "phone_number",
      "notify_phone",
      "status",
      "action_type",
      "status_updated_by",
      "created_at",
      "status_updated_at"
    ]
  },
  STOCK_MISMATCH: {
    label: "Stock Mismatch Alerts",
    statusOptions: ["OPEN", "VERIFIED", "RESOLVED"],
    columns: [
      "id",
      "item_id",
      "warehouse",
      "created_by",
      "phone_number",
      "notify_phone",
      "created_at",
      "status",
      "scenario",
      "action_required"
    ]
  },
  DISPATCH_LOGS: {
    label: "Dispatch Support & Operational Issues",
    statusOptions: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    columns: [
      "id",
      "issue_category",
      "order_id",
      "route_id",
      "item_id",
      "description",
      "photo_url",
      "warehouse",
      "created_by",
      "phone_number",
      "created_at",
      "status"
    ]
  },
  ROUTE_ISSUES: {
    label: "Route Delay Monitoring",
    statusOptions: ["OPEN", "SUPPORT_SENT", "RESOLVED"],
    columns: [
      "id",
      "route_id",
      "driver_id",
      "issue_type",
      "description",
      "latitude",
      "longitude",
      "photo_url",
      "need_help",
      "created_by",
      "phone_number",
      "created_at",
      "status"
    ]
  }
};

function buildNotificationMessage(category, previousStatus, record, newStatus) {
  if (category === "QC_FAILURE") {
    if (!previousStatus) {
      return `QC failure logged. Notifying allocator at ${record.notify_phone}.`;
    }

    if (previousStatus === "OPEN" && newStatus === "ACTION_TAKEN") {
      return `QC status set to ACTION_TAKEN. Notifying picker at ${record.phone_number}.`;
    }

    if (newStatus === "CLOSED") {
      return `QC case closed. Notifying allocator at ${record.notify_phone}.`;
    }

    if (newStatus === "ACTION_TAKEN" && record.action_type === "REPACKING") {
      return `Repacking completed. Picker at ${record.phone_number} can resume picking.`;
    }
  }

  if (category === "STOCK_MISMATCH") {
    if (!previousStatus) {
      return `Stock mismatch created. Notifying allocator at ${record.notify_phone}.`;
    }
    if (newStatus === "VERIFIED") {
      return `Stock mismatch verified. Notifying picker at ${record.phone_number}.`;
    }
    if (newStatus === "RESOLVED") {
      return `Inventory updated. Item now available for picking. Notifying picker at ${record.phone_number}.`;
    }
  }

  if (category === "DISPATCH_LOGS") {
    if (!previousStatus) {
      return `Dispatch/operational issue logged. Notifying warehouse admin and operations team.`;
    }
    if (newStatus === "IN_PROGRESS") {
      return `Issue under investigation. Notifying reporter at ${record.phone_number}.`;
    }
    if (newStatus === "RESOLVED") {
      return `Issue resolved. Notifying reporter at ${record.phone_number}.`;
    }
    if (newStatus === "CLOSED") {
      return `Issue closed. Final confirmation message sent to ${record.phone_number}.`;
    }
  }

  if (category === "ROUTE_ISSUES") {
    if (!previousStatus) {
      return `Route issue reported. Alerting transport team.`;
    }
    if (newStatus === "SUPPORT_SENT") {
      return `Support dispatched to driver. Notifying driver at ${record.phone_number}.`;
    }
    if (newStatus === "RESOLVED") {
      return `Route issue resolved. Delivery can proceed.`;
    }
  }

  return "Status updated. Notification sent.";
}

export default function CategoryScreen({ category, onBack }) {
  const [toast, setToast] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const dataMap = {
    QC_FAILURE: qcFailures,
    STOCK_MISMATCH: stockMismatch,
    DISPATCH_LOGS: dispatchLogs,
    ROUTE_ISSUES: routeIssues
  };

  const config = CATEGORY_CONFIG[category] || {
    label: category.replace("_", " "),
    statusOptions: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    columns: Object.keys((dataMap[category] && dataMap[category][0]) || {})
  };

  const [records, setRecords] = useState(
    [...dataMap[category]].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )
  );

  const updateStatus = (id, newStatus) => {
    const existing = records.find(r => r.id === id);
    if (!existing) return;

    const updatedRecord = {
      ...existing,
      status: newStatus,
      status_updated_at: new Date().toISOString()
    };

    const updated = records.map(r => (r.id === id ? updatedRecord : r));
    setRecords(updated);

    const message = buildNotificationMessage(
      category,
      existing.status,
      updatedRecord,
      newStatus
    );
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const filteredRecords = records.filter(r => {
    if (!fromDate && !toDate) return true;

    const recordDate = new Date(r.created_at);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && recordDate < from) return false;
    if (to && recordDate > to) return false;
    return true;
  });

  const visibleColumns =
    config.columns && config.columns.length
      ? config.columns
      : Object.keys(filteredRecords[0] || {});

  return (
    <div className="category-screen">
      <button onClick={onBack}>⬅ Back</button>

      <h2>{config.label}</h2>

      <div className="filter-bar">
        <input type="date" onChange={e => setFromDate(e.target.value)} />
        <input type="date" onChange={e => setToDate(e.target.value)} />
      </div>

      <table>
        <thead>
          <tr>
            {visibleColumns.map(key => (
              <th key={key}>{key}</th>
            ))}
            <th>Update Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map(record => (
            <tr key={record.id}>
              {visibleColumns.map(col => {
                const value = record[col];
                if (col === "status") {
                  return (
                    <td key={col}>
                      <StatusBadge status={value} />
                    </td>
                  );
                }
                return <td key={col}>{value?.toString()}</td>;
              })}
              <td>
                <select
                  value={record.status}
                  onChange={e => updateStatus(record.id, e.target.value)}
                >
                  {config.statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {toast && <Toast message={toast} />}
    </div>
  );
}