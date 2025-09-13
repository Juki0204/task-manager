"use client";

// import Image from "next/image";
import { useEffect, useState } from "react";
import AddTask from "@/components/AddTask";

import PersonalTaskList from "@/components/PersonalTaskList";


export default function Home() {



  return (
    <div className="p-1 py-4 sm:p-4 max-w-[1600px] relative">
      <div className="flex justify-between items-center">
        <AddTask></AddTask>
      </div>
      <PersonalTaskList></PersonalTaskList>
    </div>
  );
}
