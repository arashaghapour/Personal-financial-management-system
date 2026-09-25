import {
  testResourceRepository,
} from "./test-resource.repository.js";

import type {
  CreateTestResourceRequest,
  TestResourceResponse,
  UpdateTestResourceRequest,
} from "./test-resource.types.js";

export const createTestResource = async (
  data: CreateTestResourceRequest,
  userId: number,
): Promise<TestResourceResponse> => {
  return testResourceRepository.create({
    name: data.name,
    userId,
  });
};

export const getTestResource = async (
  resourceId: number,
  userId: number,
): Promise<TestResourceResponse | null> => {
  return testResourceRepository.findByIdAndUserId(
    resourceId,
    userId,
  );
};

export const updateTestResource = async (
  resourceId: number,
  userId: number,
  data: UpdateTestResourceRequest,
): Promise<TestResourceResponse | null> => {
  return testResourceRepository.updateByIdAndUserId(
    resourceId,
    userId,
    data,
  );
};

export const deleteTestResource = async (
  resourceId: number,
  userId: number,
): Promise<boolean> => {
  return testResourceRepository.deleteByIdAndUserId(
    resourceId,
    userId,
  );
};