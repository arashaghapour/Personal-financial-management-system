import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";

import { getCategoryErrorMessage } from "../api/error-messages";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "../schemas/category.schemas";

import { CATEGORY_TYPES, type CategoryType } from "../types";

type CategoryFormProps = {
  mode: "create" | "edit";
  initialValues?: {
    name?: string;
    type?: CategoryType;
  };
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  onCancel: () => void;
};

export function CategoryForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      type: initialValues?.type ?? "EXPENSE",
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await onSubmit({ name: values.name, type: values.type });
    } catch (error) {
      setSubmitError(getCategoryErrorMessage(error));
    }
  });

  const isCreate = mode === "create";

  return (
    <form
      className="category-form"
      onSubmit={submit}
      noValidate
      aria-busy={isSubmitting}
    >
      {submitError ? (
        <ErrorState
          title={
            isCreate ? "Unable to create category" : "Unable to update category"
          }
          message={submitError}
        />
      ) : null}

      <div className="form-field">
        <label htmlFor="category-name">Category name</label>
        <input
          id="category-name"
          type="text"
          autoComplete="off"
          autoFocus
          aria-required="true"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "category-name-error" : undefined}
          {...field("name", {
            onChange: () => setSubmitError(null),
          })}
        />
        {errors.name ? (
          <p id="category-name-error" className="form-field-error" role="alert">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="category-type">Category type</label>
        <select
          id="category-type"
          aria-required="true"
          aria-invalid={errors.type ? true : undefined}
          aria-describedby={errors.type ? "category-type-error" : undefined}
          {...field("type", {
            onChange: () => setSubmitError(null),
          })}
        >
          {CATEGORY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.type ? (
          <p id="category-type-error" className="form-field-error" role="alert">
            {errors.type.message}
          </p>
        ) : null}
      </div>

      <div className="category-form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting
            ? isCreate
              ? "Creating category…"
              : "Saving changes…"
            : isCreate
              ? "Create category"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
