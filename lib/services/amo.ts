import { amoAccounts, amoLeads, amoPipelines } from "@/lib/production-data";
import { getDateRange, isWithinDateRange, type DateRangeInput } from "@/lib/date-range";
import { getAmoAccountProfiles, getAmoCredentials, type AmoCredentials } from "@/lib/integration-settings";
import type { AmoLead, AmoPipeline, AmoStatus } from "@/lib/types";

type AmoListResponse<T> = {
  _embedded?: Record<string, T[]>;
  _links?: {
    next?: {
      href?: string;
    };
  };
  title?: string;
  detail?: string;
};

type AmoPipelineRaw = {
  id: number;
  name: string;
  sort: number;
  _embedded?: {
    statuses?: AmoStatusRaw[];
  };
};

type AmoStatusRaw = {
  id: number;
  name: string;
  sort: number;
  type?: number;
};

type AmoCustomFieldValue = {
  field_name?: string;
  field_code?: string;
  values?: Array<{ value?: string | number | boolean }>;
};

type AmoLeadRaw = {
  id: number;
  name?: string;
  price?: number;
  status_id?: number;
  pipeline_id?: number;
  responsible_user_id?: number;
  created_at?: number;
  updated_at?: number;
  closed_at?: number;
  loss_reason_id?: number | null;
  custom_fields_values?: AmoCustomFieldValue[] | null;
  _embedded?: {
    contacts?: Array<{
      id?: number;
      name?: string;
      custom_fields_values?: AmoCustomFieldValue[] | null;
    }>;
  };
};

function amoUrl(settings: AmoCredentials, path: string, params?: Record<string, string>) {
  const url = new URL(`${settings.baseUrl}${path}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function amoGet<T>(settings: AmoCredentials, path: string, params?: Record<string, string>) {
  const response = await fetch(amoUrl(settings, path, params), {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      Accept: "application/json"
    }
  });
  const body = (await response.json().catch(() => null)) as AmoListResponse<T> | null;

  if (!response.ok) {
    throw new Error(body?.detail ?? body?.title ?? `amoCRM API xatosi: ${response.status}`);
  }

  return body ?? {};
}

async function amoList<T>(
  settings: AmoCredentials,
  path: string,
  embeddedKey: string,
  params?: Record<string, string>
) {
  const items: T[] = [];
  let nextUrl: string | undefined;
  const firstPage = await amoGet<T>(settings, path, params);

  items.push(...(firstPage._embedded?.[embeddedKey] ?? []));
  nextUrl = firstPage._links?.next?.href;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${settings.accessToken}`,
        Accept: "application/json"
      }
    });
    const body = (await response.json().catch(() => null)) as AmoListResponse<T> | null;

    if (!response.ok) {
      throw new Error(body?.detail ?? body?.title ?? `amoCRM paging xatosi: ${response.status}`);
    }

    items.push(...(body?._embedded?.[embeddedKey] ?? []));
    nextUrl = body?._links?.next?.href;
  }

  return items;
}

function statusType(status: AmoStatusRaw): AmoStatus["type"] {
  if (status.id === 142 || status.sort >= 10000 && status.name.toLowerCase().includes("success")) {
    return "success";
  }

  if (status.id === 143 || status.name.toLowerCase().includes("lost")) {
    return "loss";
  }

  return "regular";
}

function mapPipeline(pipeline: AmoPipelineRaw): AmoPipeline {
  return {
    id: String(pipeline.id),
    name: pipeline.name,
    sort: pipeline.sort,
    statuses: (pipeline._embedded?.statuses ?? [])
      .map((status) => ({
        id: String(status.id),
        name: status.name,
        sort: status.sort,
        type: statusType(status)
      }))
      .sort((a, b) => a.sort - b.sort)
  };
}

function customValue(fields: AmoCustomFieldValue[] | null | undefined, keys: string[]) {
  const normalizedKeys = keys.map((key) => key.toLowerCase());
  const field = (fields ?? []).find((item) => {
    const code = item.field_code?.toLowerCase() ?? "";
    const name = item.field_name?.toLowerCase() ?? "";

    return normalizedKeys.some((key) => code.includes(key) || name.includes(key));
  });

  return String(field?.values?.[0]?.value ?? "");
}

function mapLead(lead: AmoLeadRaw, pipelines: AmoPipeline[], settings?: AmoCredentials | null): AmoLead {
  const pipeline = pipelines.find((item) => item.id === String(lead.pipeline_id));
  const status = pipeline?.statuses.find((item) => item.id === String(lead.status_id));
  const contact = lead._embedded?.contacts?.[0];
  const fields = [...(lead.custom_fields_values ?? []), ...(contact?.custom_fields_values ?? [])];
  const createdAt = lead.created_at ? new Date(lead.created_at * 1000).toISOString() : new Date().toISOString();
  const updatedAt = lead.updated_at ? new Date(lead.updated_at * 1000).toISOString() : createdAt;
  const source = customValue(fields, ["utm_source", "source", "manba"]).toLowerCase();

  return {
    id: `amo_${lead.id}`,
    amoAccountId: settings?.id ?? amoAccounts[0]?.id ?? "amo_account_primary",
    amoLeadId: String(lead.id),
    leadName: lead.name ?? `Lid ${lead.id}`,
    statusId: String(lead.status_id ?? ""),
    statusName: status?.name ?? String(lead.status_id ?? "Noma'lum"),
    pipelineId: String(lead.pipeline_id ?? ""),
    pipelineName: pipeline?.name ?? "",
    responsibleUserId: String(lead.responsible_user_id ?? ""),
    responsibleUserName: lead.responsible_user_id ? `Operator ${lead.responsible_user_id}` : "Operator belgilanmagan",
    price: Number(lead.price ?? 0),
    source: source.includes("instagram") ? "instagram" : source.includes("telegram") ? "telegram" : source.includes("facebook") ? "facebook" : "manual",
    utmSource: customValue(fields, ["utm_source"]),
    utmMedium: customValue(fields, ["utm_medium"]),
    utmCampaign: customValue(fields, ["utm_campaign"]),
    utmContent: customValue(fields, ["utm_content"]),
    utmTerm: customValue(fields, ["utm_term"]),
    phone: customValue(fields, ["phone", "telefon"]) || "",
    contactName: contact?.name ?? lead.name ?? `Lid ${lead.id}`,
    lostReason: lead.loss_reason_id ? `Sabab ID: ${lead.loss_reason_id}` : undefined,
    firstResponseMinutes: undefined,
    createdAtAmo: createdAt,
    updatedAtAmo: updatedAt,
    createdAt,
    updatedAt
  };
}

export async function connectAmoAccount() {
  const account = (await getAmoAccountProfiles())[0];

  if (!account) {
    return {
      ok: false,
      account: null,
      message: "amoCRM ulanishi sozlanmagan. AMO_SUBDOMAIN va amoCRM tokenlarini kiriting."
    };
  }

  return {
    ok: true,
    account,
    message: "amoCRM ulanish sozlamalari topildi. Varonka va lidlarni sinxronlash adapteri tayyorlanadi."
  };
}

export async function syncAmoData() {
  const settings = await getAmoCredentials();

  if (!settings) {
    return {
      ok: false,
      log: {
        integrationType: "amo",
        status: "failed",
        message: "amoCRM sozlanmagan. AMO_SUBDOMAIN va tokenlar kerak.",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString()
      }
    };
  }

  const [pipelines, leads] = await Promise.all([
    getAmoPipelines(),
    getAmoLeads("today")
  ]);

  return {
    ok: true,
    pipelines: pipelines.length,
    leads: leads.length,
    log: {
      status: "success",
      integrationType: "amo",
      message: `amoCRM API ishladi: ${pipelines.length} ta varonka, ${leads.length} ta bugungi lid olindi.`,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  };
}

export async function getAmoLeads(range: DateRangeInput = "today") {
  const settings = await getAmoCredentials();

  if (settings) {
    const { from, to } = getDateRange(range);
    const pipelines = await getAmoPipelines();
    const leads = await amoList<AmoLeadRaw>(settings, "/api/v4/leads", "leads", {
      "filter[created_at][from]": String(Math.floor(new Date(`${from}T00:00:00.000Z`).getTime() / 1000)),
      "filter[created_at][to]": String(Math.floor(new Date(`${to}T23:59:59.000Z`).getTime() / 1000)),
      with: "contacts",
      limit: "250"
    });

    return leads.map((lead) => mapLead(lead, pipelines, settings));
  }

  const { from, to } = getDateRange(range);
  return amoLeads.filter((lead) => isWithinDateRange(lead.createdAtAmo.slice(0, 10), from, to));
}

export async function getAmoPipelines() {
  const settings = await getAmoCredentials();

  if (settings) {
    const pipelines = await amoList<AmoPipelineRaw>(settings, "/api/v4/leads/pipelines", "pipelines", {
      with: "statuses",
      limit: "250"
    });

    return pipelines.map(mapPipeline).sort((a, b) => a.sort - b.sort);
  }

  return amoPipelines
    .map((pipeline) => ({
      ...pipeline,
      statuses: [...pipeline.statuses].sort((a, b) => a.sort - b.sort)
    }))
    .sort((a, b) => a.sort - b.sort);
}

export async function getAmoStatuses() {
  return (await getAmoPipelines()).flatMap((pipeline) => pipeline.statuses);
}
