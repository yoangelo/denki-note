// 作業者マスタのモックデータ
export interface Worker {
  id: string;
  name: string;
  isActive: boolean;
}

export const mockWorkers: Worker[] = [
  { id: "worker_1", name: "田中", isActive: true },
  { id: "worker_2", name: "佐藤", isActive: true },
  { id: "worker_3", name: "鈴木", isActive: true },
];
