import { Task } from "@/utils/types/task";
import { TaskColumn } from "./ui/TaskColumn";
import { User } from "@/utils/types/user";

interface PersonalTaskListProps {
  taskList: Task[];
  user: User;
  unreadIds: string[];
  sortTask: (taskList: Task[]) => Task[];
  onClick: (t: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, taskSerial: string) => void;
  currentClickTask: string | null;
  onEdit: (t: Task) => void;
  draggingTaskId: string | null;
  draggingTaskPrevIndex: number | null;
  flyAnimationRef: React.RefObject<((taskId: string) => void) | null>;
  lastDropRef: React.RefObject<{ x: number, y: number } | null>;
}

export default function PersonalTaskList({
  taskList,
  user,
  unreadIds,
  sortTask,
  onClick,
  onContextMenu,
  currentClickTask,
  onEdit,
  draggingTaskId,
  draggingTaskPrevIndex,
  flyAnimationRef,
  lastDropRef,
}: PersonalTaskListProps) {
  return (
    <div className="pb-4 overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-500">
      <div className="grid grid-cols-4 gap-2 min-w-[1868px]">
        <TaskColumn
          id="NotYetStarted"
          title="未担当タスク"
          tasks={taskList.filter((task) => !task.manager)}
          user={user}
          unreadIds={unreadIds}
          onClick={onClick}
          onContextMenu={onContextMenu}
          className="bg-[#484850] p-2 rounded-md flex flex-col gap-1 min-h-[calc(100vh-9.5rem)] min-w-[calc((1868px-1.5rem)/4)]"
          currentClickTask={currentClickTask}
          onEdit={onEdit}
          draggingTaskId={draggingTaskId}
          draggingTaskPrevIndex={draggingTaskPrevIndex}
          flyAnimationRef={flyAnimationRef}
          lastDropRef={lastDropRef}
        />

        <TaskColumn
          id="InProgress"
          title="未着手・作業中タスク"
          tasks={sortTask(taskList).filter((task) => task.manager && task.status !== '確認中' && task.status !== '完了')}
          user={user}
          unreadIds={unreadIds}
          onClick={onClick}
          onContextMenu={onContextMenu}
          className="bg-[#425066] p-2 rounded-md flex flex-col gap-1 min-h-[calc(100vh-9.5rem)] min-w-[calc((1868px-1.5rem)/4)]"
          currentClickTask={currentClickTask}
          onEdit={onEdit}
          draggingTaskId={draggingTaskId}
          draggingTaskPrevIndex={draggingTaskPrevIndex}
          flyAnimationRef={flyAnimationRef}
          lastDropRef={lastDropRef}
        />

        <TaskColumn
          id="Confirm"
          title="確認中タスク"
          tasks={taskList.filter((task) => task.status === '確認中')}
          user={user}
          unreadIds={unreadIds}
          onClick={onClick}
          onContextMenu={onContextMenu}
          className="bg-[#354b4e] p-2 rounded-md flex flex-col gap-1 min-h-[calc(100vh-9.5rem)] min-w-[calc((1868px-1.5rem)/4)]"
          currentClickTask={currentClickTask}
          onEdit={onEdit}
          draggingTaskId={draggingTaskId}
          draggingTaskPrevIndex={draggingTaskPrevIndex}
          flyAnimationRef={flyAnimationRef}
          lastDropRef={lastDropRef}
        />

        <TaskColumn
          id="Completed"
          title="完了済タスク（直近1週間）"
          tasks={taskList.filter((task) => {
            if (task.status !== '完了') return false;
            if (!task.finish_date) return false;

            // finishDateを常にローカル日付として解釈
            const finish = new Date(`${task.finish_date}T00:00:00`);
            const today = new Date();

            // 今日の0時時点から7日前の0時までを計算
            const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();
            const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).getTime();

            return finish.getTime() >= weekAgo && finish.getTime() < endOfToday;
          }).sort((a, b) => {
            const finishA = a.finish_date ? new Date(`${a.finish_date}`).getTime() : 0;
            const finishB = b.finish_date ? new Date(`${b.finish_date}`).getTime() : 0;

            //完了日順ソート
            return finishA - finishB;
          })}
          user={user}
          unreadIds={unreadIds}
          onClick={onClick}
          onContextMenu={onContextMenu}
          className="bg-[#4b4a3e] p-2 rounded-md flex flex-col gap-1 min-h-[calc(100vh-9.5rem)] min-w-[calc((1868px-1.5rem)/4)]"
          currentClickTask={currentClickTask}
          onEdit={onEdit}
          draggingTaskId={draggingTaskId}
          draggingTaskPrevIndex={draggingTaskPrevIndex}
          flyAnimationRef={flyAnimationRef}
          lastDropRef={lastDropRef}
        />
      </div>
    </div>
  )
}