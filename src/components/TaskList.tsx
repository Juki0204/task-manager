"use client";
import { supabase } from "../utils/supabase/supabase";

export default function TaskList() {
  const getTasks = async () => {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*');
  }
}