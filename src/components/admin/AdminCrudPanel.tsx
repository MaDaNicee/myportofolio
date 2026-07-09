"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit3, FiPlus, FiRefreshCw, FiSave, FiTrash2, FiX } from "react-icons/fi";

type FieldType = "text" | "textarea" | "array" | "number" | "checkbox" | "image" | "file";

type FieldConfig = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
};

type ResourceConfig = {
  key: string;
  label: string;
  endpoint: string;
  fields: FieldConfig[];
  titleField: string;
  subtitleField?: string;
};

type ApiItem = Record<string, unknown> & {
  id: string;
};

type FormState = Record<string, string | boolean>;

const resources: ResourceConfig[] = [
  {
    key: "profile",
    label: "Profile",
    endpoint: "/api/profile",
    titleField: "name",
    subtitleField: "title",
    fields: [
      { name: "name", label: "Nama", required: true },
      { name: "nickname", label: "Nickname", required: true },
      { name: "title", label: "Title", required: true },
      { name: "avatar", label: "Avatar", type: "image", required: true },
      { name: "cvUrl", label: "CV PDF", type: "file" },
      { name: "bio", label: "Bio", type: "textarea", required: true },
      { name: "email", label: "Email", required: true },
      { name: "phone", label: "Phone", required: true },
      { name: "github", label: "GitHub", required: true },
      { name: "linkedin", label: "LinkedIn", required: true },
      { name: "instagram", label: "Instagram" },
    ],
  },
  {
    key: "projects",
    label: "Projects",
    endpoint: "/api/projects",
    titleField: "title",
    subtitleField: "description",
    fields: [
      { name: "title", label: "Judul", required: true },
      { name: "description", label: "Deskripsi", type: "textarea", required: true },
      { name: "technologies", label: "Technologies", type: "array" },
      { name: "imageUrl", label: "Image", type: "image", required: true },
      { name: "demoUrl", label: "Demo URL" },
      { name: "githubUrl", label: "GitHub URL" },
      { name: "featured", label: "Featured", type: "checkbox" },
      { name: "sortOrder", label: "Urutan", type: "number" },
    ],
  },
  {
    key: "experiences",
    label: "Experience",
    endpoint: "/api/experiences",
    titleField: "role",
    subtitleField: "company",
    fields: [
      { name: "role", label: "Role", required: true },
      { name: "company", label: "Company", required: true },
      { name: "type", label: "Type", required: true },
      { name: "period", label: "Period", required: true },
      { name: "location", label: "Location", required: true },
      { name: "description", label: "Deskripsi", type: "textarea", required: true },
      { name: "highlights", label: "Highlights", type: "array" },
      { name: "technologies", label: "Technologies", type: "array" },
      { name: "sortOrder", label: "Urutan", type: "number" },
    ],
  },
  {
    key: "certificates",
    label: "Certificates",
    endpoint: "/api/certificates",
    titleField: "name",
    subtitleField: "issuer",
    fields: [
      { name: "name", label: "Nama", required: true },
      { name: "issuer", label: "Issuer", required: true },
      { name: "date", label: "Tanggal", required: true },
      { name: "url", label: "URL", required: true },
      { name: "imageUrl", label: "Image", type: "image" },
      { name: "sortOrder", label: "Urutan", type: "number" },
    ],
  },
  {
    key: "skills",
    label: "Skills",
    endpoint: "/api/skills",
    titleField: "name",
    subtitleField: "group",
    fields: [
      { name: "name", label: "Nama", required: true },
      { name: "iconKey", label: "Icon Key" },
      { name: "group", label: "Group" },
      { name: "sortOrder", label: "Urutan", type: "number" },
    ],
  },
  {
    key: "comments",
    label: "Comments",
    endpoint: "/api/comments",
    titleField: "name",
    subtitleField: "role",
    fields: [
      { name: "name", label: "Nama", required: true },
      { name: "role", label: "Role" },
      { name: "message", label: "Pesan", type: "textarea", required: true },
    ],
  },
];

function createEmptyForm(config: ResourceConfig): FormState {
  return config.fields.reduce<FormState>((form, field) => {
    form[field.name] = field.type === "checkbox" ? false : "";

    return form;
  }, {});
}

function stringifyFieldValue(value: unknown) {
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;

  return "";
}

function createFormFromItem(config: ResourceConfig, item: ApiItem): FormState {
  return config.fields.reduce<FormState>((form, field) => {
    const value = item[field.name];

    form[field.name] = field.type === "checkbox" ? Boolean(value) : stringifyFieldValue(value);

    return form;
  }, {});
}

function getPayload(config: ResourceConfig, form: FormState) {
  return config.fields.reduce<Record<string, unknown>>((payload, field) => {
    const value = form[field.name];

    if (field.type === "checkbox") {
      payload[field.name] = Boolean(value);
      return payload;
    }

    if (field.type === "number") {
      const parsed = Number(value);
      payload[field.name] = Number.isFinite(parsed) ? parsed : 0;
      return payload;
    }

    if (field.type === "array") {
      payload[field.name] = String(value)
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      return payload;
    }

    payload[field.name] = String(value).trim();

    return payload;
  }, {});
}

function getItemText(item: ApiItem, fieldName?: string) {
  if (!fieldName) return "";

  const value = item[fieldName];

  if (typeof value !== "string") return "";

  return value;
}

export default function AdminCrudPanel() {
  const [activeKey, setActiveKey] = useState(resources[0].key);
  const activeResource = useMemo(
    () => resources.find((resource) => resource.key === activeKey) ?? resources[0],
    [activeKey],
  );
  const [items, setItems] = useState<ApiItem[]>([]);
  const [form, setForm] = useState<FormState>(() => createEmptyForm(activeResource));
  const [editingItem, setEditingItem] = useState<ApiItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const loadItems = useCallback(async (config = activeResource) => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(config.endpoint, { cache: "no-store" });

      if (!response.ok) throw new Error("Gagal mengambil data.");

      const data = (await response.json()) as ApiItem[];

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setItems([]);
      setMessage(error instanceof Error ? error.message : "Gagal mengambil data.");
    } finally {
      setIsLoading(false);
    }
  }, [activeResource]);

  useEffect(() => {
    setEditingItem(null);
    setForm(createEmptyForm(activeResource));
    loadItems(activeResource);
  }, [activeResource, loadItems]);

  function resetForm() {
    setEditingItem(null);
    setForm(createEmptyForm(activeResource));
  }

  function handleEdit(item: ApiItem) {
    setEditingItem(item);
    setForm(createFormFromItem(activeResource, item));
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const endpoint = editingItem ? `${activeResource.endpoint}/${editingItem.id}` : activeResource.endpoint;
      const response = await fetch(endpoint, {
        method: editingItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload(activeResource, form)),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;

        throw new Error(data?.error || "Data gagal disimpan.");
      }

      setMessage(editingItem ? "Data berhasil diperbarui." : "Data berhasil ditambahkan.");
      resetForm();
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Data gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item: ApiItem) {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${activeResource.endpoint}/${item.id}`, { method: "DELETE" });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;

        throw new Error(data?.error || "Data gagal dihapus.");
      }

      if (editingItem?.id === item.id) resetForm();
      setMessage("Data berhasil dihapus.");
      await loadItems();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Data gagal dihapus.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImageUpload(fieldName: string, file?: File) {
    if (!file) return;

    setUploadingField(fieldName);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("resource", activeResource.key);
      formData.append("field", fieldName);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as { path?: string; error?: string } | null;

      if (!response.ok || !data?.path) {
        throw new Error(data?.error || "Upload gambar gagal.");
      }

      setForm((current) => ({ ...current, [fieldName]: data.path ?? "" }));
      setMessage("Gambar berhasil diupload dan path sudah diisi otomatis.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload gambar gagal.");
    } finally {
      setUploadingField(null);
    }
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-light-border/70 bg-white/65 p-5 shadow-2xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/25 md:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-accent-primary">Admin Form</p>
          <h2 className="mt-2 text-2xl font-black text-text-light-primary dark:text-text-dark-primary">Kelola Konten</h2>
        </div>
        <button
          type="button"
          onClick={() => loadItems()}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-light-border/70 bg-white/70 px-4 text-sm font-bold text-text-light-primary transition-colors hover:border-accent-primary/50 hover:text-accent-primary disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <FiRefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {resources.map((resource) => (
          <button
            key={resource.key}
            type="button"
            onClick={() => setActiveKey(resource.key)}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-black transition-colors ${
              activeKey === resource.key
                ? "border-accent-primary/40 bg-accent-primary text-white shadow-lg shadow-accent-primary/25"
                : "border-light-border/70 bg-white/65 text-text-light-secondary hover:border-accent-primary/40 hover:text-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-secondary"
            }`}
          >
            {resource.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)]">
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-light-border/70 bg-white/40 p-6 text-center text-sm font-semibold text-text-light-secondary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-secondary">
              {isLoading ? "Memuat data..." : "Belum ada data."}
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-light-border/70 bg-white/55 p-4 shadow-lg shadow-black/5 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black text-text-light-primary dark:text-text-dark-primary">
                      {getItemText(item, activeResource.titleField) || "Tanpa judul"}
                    </h3>
                    {activeResource.subtitleField && (
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">
                        {getItemText(item, activeResource.subtitleField)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-light-border/70 bg-white/70 px-3 text-sm font-bold text-text-light-primary transition-colors hover:border-accent-primary/50 hover:text-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      <FiEdit3 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={isSaving}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-light-border/70 bg-white/70 px-3 text-sm font-bold text-text-light-primary transition-colors hover:border-red-400/50 hover:text-red-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-light-border/70 bg-white/55 p-5 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-white/5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-text-light-primary dark:text-text-dark-primary">
                {editingItem ? `Edit ${activeResource.label}` : `Tambah ${activeResource.label}`}
              </h3>
            </div>
            {editingItem ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-light-border/70 bg-white/70 px-3 text-sm font-bold text-text-light-primary transition-colors hover:border-accent-primary/50 hover:text-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <FiX className="h-4 w-4" />
                Batal
              </button>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
                <FiPlus className="h-5 w-5" />
              </span>
            )}
          </div>

          <div className="space-y-4">
            {activeResource.fields.map((field) => {
              const value = form[field.name];

              if (field.type === "checkbox") {
                return (
                  <label key={field.name} className="flex items-center justify-between gap-4 rounded-2xl border border-light-border/70 bg-white/50 px-4 py-3 text-sm font-bold text-text-light-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-primary">
                    <span>{field.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.checked }))}
                      className="h-5 w-5 accent-accent-primary"
                    />
                  </label>
                );
              }

              if (field.type === "image" || field.type === "file") {
                const filePath = String(value ?? "");
                const isImageField = field.type === "image";

                return (
                  <label key={field.name} className="block">
                    <span className="mb-2 block text-sm font-bold text-text-light-primary dark:text-text-dark-primary">{field.label}</span>
                    <div className="space-y-3 rounded-2xl border border-light-border/70 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
                      {filePath && isImageField && (
                        <div className="relative overflow-hidden rounded-xl border border-light-border/70 bg-white/60 dark:border-white/10 dark:bg-black/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={filePath} alt={field.label} className="h-36 w-full object-cover" />
                        </div>
                      )}
                      {filePath && !isImageField && (
                        <a
                          href={filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl border border-light-border/70 bg-white/70 px-4 py-3 text-sm font-bold text-accent-primary transition-colors hover:border-accent-primary/50 dark:border-white/10 dark:bg-white/5"
                        >
                          Buka PDF: {filePath}
                        </a>
                      )}
                      <input
                        type="text"
                        value={filePath}
                        onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                        required={field.required}
                        placeholder={isImageField ? "/uploads/projects/nama-file.png" : "/uploads/profile/documents/cv.pdf"}
                        className="h-12 w-full rounded-xl border border-light-border/70 bg-white/80 px-4 text-sm font-medium text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-primary"
                      />
                      <input
                        type="file"
                        accept={isImageField ? "image/jpeg,image/png,image/webp,image/gif" : "application/pdf"}
                        disabled={uploadingField === field.name}
                        onChange={(event) => handleImageUpload(field.name, event.target.files?.[0])}
                        className="block w-full cursor-pointer rounded-xl border border-light-border/70 bg-white/80 text-sm font-medium text-text-light-secondary file:mr-4 file:h-11 file:border-0 file:bg-accent-primary file:px-4 file:text-sm file:font-black file:text-white dark:border-white/10 dark:bg-white/5 dark:text-text-dark-secondary"
                      />
                      {uploadingField === field.name && (
                        <p className="text-xs font-bold text-accent-primary">Mengupload file...</p>
                      )}
                    </div>
                  </label>
                );
              }

              if (field.type === "textarea" || field.type === "array") {
                return (
                  <label key={field.name} className="block">
                    <span className="mb-2 block text-sm font-bold text-text-light-primary dark:text-text-dark-primary">{field.label}</span>
                    <textarea
                      value={String(value ?? "")}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      required={field.required}
                      rows={field.type === "array" ? 4 : 5}
                      className="w-full resize-none rounded-2xl border border-light-border/70 bg-white/80 px-4 py-3 text-sm font-medium text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-primary"
                    />
                  </label>
                );
              }

              return (
                <label key={field.name} className="block">
                  <span className="mb-2 block text-sm font-bold text-text-light-primary dark:text-text-dark-primary">{field.label}</span>
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    value={String(value ?? "")}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    required={field.required}
                    className="h-12 w-full rounded-2xl border border-light-border/70 bg-white/80 px-4 text-sm font-medium text-text-light-primary outline-none transition-colors placeholder:text-text-light-muted focus:border-accent-primary dark:border-white/10 dark:bg-white/5 dark:text-text-dark-primary"
                  />
                </label>
              );
            })}
          </div>

          {message && (
            <p className="mt-4 rounded-2xl border border-accent-primary/20 bg-accent-primary/10 px-4 py-3 text-sm font-bold text-accent-primary">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-accent-primary to-accent-secondary px-5 text-sm font-black text-white shadow-xl shadow-accent-primary/25 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <FiSave className="h-4 w-4" />
            {isSaving ? "Menyimpan" : editingItem ? "Update Data" : "Simpan Data"}
          </button>
        </form>
      </div>
    </section>
  );
}
