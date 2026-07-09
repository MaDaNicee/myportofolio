import type { Prisma } from "@/generated/prisma/client";
import {
  getBoolean,
  getNumber,
  getOptionalString,
  getString,
  getStringArray,
  type JsonBody,
} from "@/lib/api-utils";

type BuildResult<T> = { data: T } | { error: string };

const noUpdateMessage = "Tidak ada field yang dikirim untuk diperbarui.";

function hasUpdates(data: object) {
  return Object.keys(data).length > 0;
}

export function buildProfileCreateInput(body: JsonBody): BuildResult<Prisma.ProfileCreateInput> {
  const name = getString(body, "name");
  const nickname = getString(body, "nickname");
  const title = getString(body, "title");
  const avatar = getString(body, "avatar");
  const bio = getString(body, "bio");
  const email = getString(body, "email");
  const phone = getString(body, "phone");
  const github = getString(body, "github");
  const linkedin = getString(body, "linkedin");

  if (!name || !nickname || !title || !avatar || !bio || !email || !phone || !github || !linkedin) {
    return { error: "Field wajib: name, nickname, title, avatar, bio, email, phone, github, linkedin." };
  }

  return {
    data: {
      name,
      nickname,
      title,
      avatar,
      cvUrl: getOptionalString(body, "cvUrl") ?? null,
      bio,
      email,
      phone,
      github,
      linkedin,
      instagram: getOptionalString(body, "instagram") ?? null,
    },
  };
}

export function buildProfileUpdateInput(body: JsonBody): BuildResult<Prisma.ProfileUpdateInput> {
  const data: Prisma.ProfileUpdateInput = {};
  const textFields = ["name", "nickname", "title", "avatar", "bio", "email", "phone", "github", "linkedin"] as const;

  textFields.forEach((field) => {
    const value = getString(body, field);

    if (value) data[field] = value;
  });

  const instagram = getOptionalString(body, "instagram");
  const cvUrl = getOptionalString(body, "cvUrl");

  if (instagram !== undefined) data.instagram = instagram;
  if (cvUrl !== undefined) data.cvUrl = cvUrl;

  return hasUpdates(data) ? { data } : { error: noUpdateMessage };
}

export function buildProjectCreateInput(body: JsonBody): BuildResult<Prisma.ProjectCreateInput> {
  const title = getString(body, "title");
  const description = getString(body, "description");
  const imageUrl = getString(body, "imageUrl");

  if (!title || !description || !imageUrl) {
    return { error: "Field wajib: title, description, imageUrl." };
  }

  return {
    data: {
      title,
      description,
      imageUrl,
      technologies: getStringArray(body, "technologies") ?? [],
      demoUrl: getOptionalString(body, "demoUrl") ?? null,
      githubUrl: getOptionalString(body, "githubUrl") ?? null,
      featured: getBoolean(body, "featured") ?? false,
      sortOrder: getNumber(body, "sortOrder") ?? 0,
    },
  };
}

export function buildProjectUpdateInput(body: JsonBody): BuildResult<Prisma.ProjectUpdateInput> {
  const data: Prisma.ProjectUpdateInput = {};
  const textFields = ["title", "description", "imageUrl"] as const;

  textFields.forEach((field) => {
    const value = getString(body, field);

    if (value) data[field] = value;
  });

  const technologies = getStringArray(body, "technologies");
  const demoUrl = getOptionalString(body, "demoUrl");
  const githubUrl = getOptionalString(body, "githubUrl");
  const featured = getBoolean(body, "featured");
  const sortOrder = getNumber(body, "sortOrder");

  if (technologies) data.technologies = technologies;
  if (demoUrl !== undefined) data.demoUrl = demoUrl;
  if (githubUrl !== undefined) data.githubUrl = githubUrl;
  if (featured !== undefined) data.featured = featured;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  return hasUpdates(data) ? { data } : { error: noUpdateMessage };
}

export function buildExperienceCreateInput(body: JsonBody): BuildResult<Prisma.ExperienceCreateInput> {
  const role = getString(body, "role");
  const company = getString(body, "company");
  const type = getString(body, "type");
  const period = getString(body, "period");
  const location = getString(body, "location");
  const description = getString(body, "description");

  if (!role || !company || !type || !period || !location || !description) {
    return { error: "Field wajib: role, company, type, period, location, description." };
  }

  return {
    data: {
      role,
      company,
      type,
      period,
      location,
      description,
      highlights: getStringArray(body, "highlights") ?? [],
      technologies: getStringArray(body, "technologies") ?? [],
      sortOrder: getNumber(body, "sortOrder") ?? 0,
    },
  };
}

export function buildExperienceUpdateInput(body: JsonBody): BuildResult<Prisma.ExperienceUpdateInput> {
  const data: Prisma.ExperienceUpdateInput = {};
  const textFields = ["role", "company", "type", "period", "location", "description"] as const;

  textFields.forEach((field) => {
    const value = getString(body, field);

    if (value) data[field] = value;
  });

  const highlights = getStringArray(body, "highlights");
  const technologies = getStringArray(body, "technologies");
  const sortOrder = getNumber(body, "sortOrder");

  if (highlights) data.highlights = highlights;
  if (technologies) data.technologies = technologies;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  return hasUpdates(data) ? { data } : { error: noUpdateMessage };
}

export function buildCertificateCreateInput(body: JsonBody): BuildResult<Prisma.CertificateCreateInput> {
  const name = getString(body, "name");
  const issuer = getString(body, "issuer");
  const date = getString(body, "date");
  const url = getString(body, "url");

  if (!name || !issuer || !date || !url) {
    return { error: "Field wajib: name, issuer, date, url." };
  }

  return {
    data: {
      name,
      issuer,
      date,
      url,
      imageUrl: getOptionalString(body, "imageUrl") ?? null,
      sortOrder: getNumber(body, "sortOrder") ?? 0,
    },
  };
}

export function buildCertificateUpdateInput(body: JsonBody): BuildResult<Prisma.CertificateUpdateInput> {
  const data: Prisma.CertificateUpdateInput = {};
  const textFields = ["name", "issuer", "date", "url"] as const;

  textFields.forEach((field) => {
    const value = getString(body, field);

    if (value) data[field] = value;
  });

  const imageUrl = getOptionalString(body, "imageUrl");
  const sortOrder = getNumber(body, "sortOrder");

  if (imageUrl !== undefined) data.imageUrl = imageUrl;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  return hasUpdates(data) ? { data } : { error: noUpdateMessage };
}

export function buildSkillCreateInput(body: JsonBody): BuildResult<Prisma.SkillCreateInput> {
  const name = getString(body, "name");

  if (!name) {
    return { error: "Field wajib: name." };
  }

  return {
    data: {
      name,
      iconKey: getOptionalString(body, "iconKey") ?? null,
      group: getString(body, "group") ?? "row1",
      sortOrder: getNumber(body, "sortOrder") ?? 0,
    },
  };
}

export function buildSkillUpdateInput(body: JsonBody): BuildResult<Prisma.SkillUpdateInput> {
  const data: Prisma.SkillUpdateInput = {};
  const name = getString(body, "name");
  const iconKey = getOptionalString(body, "iconKey");
  const group = getString(body, "group");
  const sortOrder = getNumber(body, "sortOrder");

  if (name) data.name = name;
  if (iconKey !== undefined) data.iconKey = iconKey;
  if (group) data.group = group;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  return hasUpdates(data) ? { data } : { error: noUpdateMessage };
}

export function buildCommentCreateInput(body: JsonBody): BuildResult<Prisma.CommentCreateInput> {
  const name = getString(body, "name");
  const message = getString(body, "message");

  if (!name || !message) {
    return { error: "Field wajib: name, message." };
  }

  return {
    data: {
      name,
      message,
      role: getString(body, "role") ?? "Visitor",
    },
  };
}

export function buildCommentUpdateInput(body: JsonBody): BuildResult<Prisma.CommentUpdateInput> {
  const data: Prisma.CommentUpdateInput = {};
  const name = getString(body, "name");
  const role = getString(body, "role");
  const message = getString(body, "message");

  if (name) data.name = name;
  if (role) data.role = role;
  if (message) data.message = message;

  return hasUpdates(data) ? { data } : { error: noUpdateMessage };
}
