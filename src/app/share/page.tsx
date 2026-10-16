"use client";
import React, { Suspense } from "react";
import AnyDropDashboard from "@/components/transfer/AnyDropDashboard";

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center text-slate-500 font-medium">
          Loading AnyDrop...
        </div>
      }
    >
      <AnyDropDashboard />
    </Suspense>
  );
}
