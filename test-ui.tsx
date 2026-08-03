import React from 'react';
import { renderToString } from 'react-dom/server';

function Test() {
  const product = {
    name: "Test",
    sku: "TEST-123",
    warrantyMonths: 12,
    creditPoints: 100,
    scans: [
      { scannedAt: "2026-07-24T12:00:00.000Z" }
    ]
  };

  const firstScan = product.scans[0];
  const warrantyStart = new Date(firstScan.scannedAt);
  const warrantyEnd = new Date(warrantyStart);
  warrantyEnd.setMonth(warrantyEnd.getMonth() + product.warrantyMonths);
  
  const now = new Date();
  const isActive = now <= warrantyEnd;

  return (
    <div>
      {product.scans.length === 1 && (
        <div>Points credited!</div>
      )}
      {product.scans.length > 1 && (
        <div>Timer</div>
      )}
    </div>
  );
}

console.log(renderToString(<Test />));
