export type CreateTestResourceRequest = {
  name: string;
};

export type TestResourceResponse = {
  id: number;
  userId: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateTestResourceRequest = {
  name?: string;
};

