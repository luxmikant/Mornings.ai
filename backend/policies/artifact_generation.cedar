// ═══════════════════════════════════════════════════════════
// Agentic PR Manager — Cedar Authorization Policies
// ═══════════════════════════════════════════════════════════
// These policies govern what artifacts can be generated for which users.

// ── Archetype-Event Matching Rules ─────────────────────────

// CULTURAL_LEADER: Can generate for religious tithis and solar festivals only
permit (
    principal,
    action == Action::"GenerateArtifact",
    resource
) when {
    principal.archetype == "CULTURAL_LEADER" &&
    (resource.event_type == "PANCHANG_TITHI" || resource.event_type == "SOLAR_FESTIVAL")
};

// CIVIC_REPRESENTATIVE: Can generate for all event types
permit (
    principal,
    action == Action::"GenerateArtifact",
    resource
) when {
    principal.archetype == "CIVIC_REPRESENTATIVE"
};

// FAMILY_HEAD: Can generate for all except civic pulse
permit (
    principal,
    action == Action::"GenerateArtifact",
    resource
) when {
    principal.archetype == "FAMILY_HEAD" &&
    resource.event_type != "CIVIC_PULSE"
};

// LOCAL_PROFESSIONAL: Can generate for festivals and national holidays
permit (
    principal,
    action == Action::"GenerateArtifact",
    resource
) when {
    principal.archetype == "LOCAL_PROFESSIONAL" &&
    (resource.event_type == "SOLAR_FESTIVAL" ||
     resource.event_type == "NATIONAL_HOLIDAY" ||
     resource.event_type == "PANCHANG_TITHI")
};

// ── Content Safety Rules ───────────────────────────────────

// DENY: No archetype may auto-post directly to social media
forbid (
    principal,
    action == Action::"AutoPostSocial",
    resource
);

// DENY: Artifact must not contain unverified (hallucinated) verses
forbid (
    principal,
    action == Action::"GenerateArtifact",
    resource
) when {
    context.shloka_source == "UNVERIFIED"
};
