import { Task } from "@/utils/types/task";
import { TaskColumn } from "./ui/TaskColumn";
import { User } from "@/utils/types/user";

interface PersonalTaskListProps {
  taskList: Task[];
  user: User;
  sortTask: (taskList: Task[]) => Task[];
  onClick: (t: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
  currentClickTask: string | null;
  onEdit: (t: Task) => void;
  draggingTaskId: string | null;
  draggingTaskPrevIndex: number | null;
  flyAnimationRef: React.RefObject<((taskId: string) => void) | null>;
  lastDropRef: React.RefObject<{ x: number, y: number } | null>;
  deadlineList: { task_id: string, date: string }[];
}

export default function PersonalTaskList({
  taskList,
  user,
  sortTask,
  onClick,
  onContextMenu,
  currentClickTask,
  onEdit,
  draggingTaskId,
  draggingTaskPrevIndex,
  flyAnimationRef,
  lastDropRef,
  deadlineList,
}: PersonalTaskListProps) {
  return (
    <div className="pb-2 overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
      <div className="grid grid-cols-4 min-w-380">
        <TaskColumn
          id="NotYetStarted"
          title="未担当タスク"
          tasks={taskList.filter((task) => !task.manager && task.status === '未着手' || !task.manager && task.status === '詳細待ち' || !task.manager && task.status === '中止' || !task.manager && task.status === '保留')}
          user={user}
          onClick={onClick}
          onContextMenu={onContextMenu}
          titleStyle="bg-gray-200 dark:bg-neutral-700/50"
          currentClickTask={currentClickTask}
          onEdit={onEdit}
          draggingTaskId={draggingTaskId}
          draggingTaskPrevIndex={draggingTaskPrevIndex}
          flyAnimationRef={flyAnimationRef}
          lastDropRef={lastDropRef}
          deadlineList={deadlineList}
        />

        <TaskColumn
          id="InProgress"
          title="未着手・作業中タスク"
          tasks={sortTask(taskList).filter((task) => task.manager && task.status !== '確認中' && task.status !== '完了')}
          user={user}
          onClick={onClick}
          onContextMenu={onContextMenu}
          titleStyle="bg-blue-600/10 dark:bg-blue-400/10"
          currentClickTask={currentClickTask}
          onEdit={onEdit}
          draggingTaskId={draggingTaskId}
          draggingTaskPrevIndex={draggingTaskPrevIndex}
          flyAnimationRef={flyAnimationRef}
          lastDropRef={lastDropRef}
          deadlineList={deadlineList}
        />

        <TaskColumn
          id="Confirm"
          title="確認中タスク"
          tasks={taskList.filter((task) => task.manager && task.status === '確認中')}
          user={user}
          onClick={onClick}
          onContextMenu={onContextMenu}
          titleStyle="bg-pink-400/10 dark:bg-pink-400/15"
          currentClickTask={currentClickTask}
          onEdit={onEdit}
          draggingTaskId={draggingTaskId}
          draggingTaskPrevIndex={draggingTaskPrevIndex}
          flyAnimationRef={flyAnimationRef}
          lastDropRef={lastDropRef}
          deadlineList={deadlineList}
        />

        <TaskColumn
          id="Completed"
          title="完了済タスク（直近1週間）"
          tasks={taskList.filter((task) => {
            if (!task.manager) return;
            if (task.status !== '完了') return false;
            if (!task.finish_date) return true;

            // finishDateを常にローカル日付として解釈
            const finish = new Date(`${task.finish_date}T00:00:00`);
            const today = new Date();

            // 今日の0時時点から7日前の0時までを計算
            const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();
            const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).getTime();

            return finish.getTime() >= weekAgo && finish.getTime() < endOfToday;
          }).sort((a, b) => {
            const finishA = a.finish_date ? new Date(`${a.finish_date}T00:00:00`).getTime() : -Infinity;
            const finishB = b.finish_date ? new Date(`${b.finish_date}T00:00:00`).getTime() : -Infinity;

            //完了日順ソート
            return finishA - finishB;
          })}
          user={user}
          onClick={onClick}
          onContextMenu={onContextMenu}
          titleStyle="bg-green-600/10 dark:bg-green-300/10"
          currentClickTask={currentClickTask}
          onEdit={onEdit}
          draggingTaskId={draggingTaskId}
          draggingTaskPrevIndex={draggingTaskPrevIndex}
          flyAnimationRef={flyAnimationRef}
          lastDropRef={lastDropRef}
          deadlineList={deadlineList}
        />
      </div>
    </div>
  )
}