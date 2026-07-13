import { describe, it, expect } from "vitest";
import { mergeSectionData, mergeSections } from "./theme-merge";

describe("mergeSectionData", () => {
  it("keeps every key the user authored, even when empty", () => {
    const user = { title: "Our Story", body: "", subtitle: "" };
    const tpl = { title: "Template title", body: "Template body", subtitle: "Template subtitle", extra: "x" };
    const out = mergeSectionData(user, tpl);
    expect(out.title).toBe("Our Story");
    expect(out.body).toBe("");
    expect(out.subtitle).toBe("");
    expect(out.extra).toBe("x"); // only truly missing keys are filled
  });

  it("returns a copy of template data when user has none", () => {
    const tpl = { a: 1, b: 2 };
    const out = mergeSectionData(undefined, tpl);
    expect(out).toEqual(tpl);
    expect(out).not.toBe(tpl);
  });
});

describe("mergeSections – Apply on top of existing", () => {
  const tplSections = [
    { id: "story", title: "Our Story", visible: true, data: { text: "Template story", note: "tpl-note" } },
    { id: "events", title: "Events", visible: true, data: { events: [{ name: "Template ceremony" }] } },
    { id: "rsvp", title: "RSVP", visible: true, data: { headline: "Template RSVP", cta: "RSVP now" } },
    { id: "registry", title: "Registry", visible: true, data: { url: "" } },
  ];

  it("never deletes custom story, events, or RSVP fields", () => {
    const userSections = [
      { id: "story", title: "How we met", visible: true, data: { text: "We met in Paris" } },
      { id: "events", title: "Our Events", visible: true, data: { events: [{ name: "Sangeet" }, { name: "Reception" }] } },
      { id: "rsvp", title: "Reply", visible: false, data: { headline: "Please RSVP", email: "us@example.com" } },
    ];
    const out = mergeSections(userSections, tplSections);

    const story = out.find((s: any) => s.id === "story");
    expect(story.title).toBe("How we met");
    expect(story.data.text).toBe("We met in Paris");
    expect(story.data.note).toBe("tpl-note"); // missing key filled from template

    const events = out.find((s: any) => s.id === "events");
    expect(events.data.events).toHaveLength(2);
    expect(events.data.events[0].name).toBe("Sangeet");

    const rsvp = out.find((s: any) => s.id === "rsvp");
    expect(rsvp.data.headline).toBe("Please RSVP");
    expect(rsvp.data.email).toBe("us@example.com");
    expect(rsvp.data.cta).toBe("RSVP now");
    expect(rsvp.visible).toBe(false); // user visibility preserved
  });

  it("only appends template sections the user does not already have", () => {
    const userSections = [
      { id: "story", title: "Our Story", visible: true, data: { text: "x" } },
    ];
    const out = mergeSections(userSections, tplSections);
    expect(out.map((s: any) => s.id)).toEqual(["story", "events", "rsvp", "registry"]);
    // Existing story is not replaced by template placeholder text.
    expect(out[0].data.text).toBe("x");
  });

  it("preserves user-added custom sections not in the template", () => {
    const userSections = [
      { id: "story", title: "Our Story", visible: true, data: { text: "x" } },
      { id: "gallery", title: "Photos", visible: true, data: { images: ["a.jpg"] } },
    ];
    const out = mergeSections(userSections, tplSections);
    const gallery = out.find((s: any) => s.id === "gallery");
    expect(gallery).toBeTruthy();
    expect(gallery.data.images).toEqual(["a.jpg"]);
  });

  it("preserves user's section order and appends missing template sections at the end", () => {
    const userSections = [
      { id: "rsvp", title: "Reply", visible: true, data: {} },
      { id: "story", title: "Story", visible: true, data: {} },
    ];
    const out = mergeSections(userSections, tplSections);
    expect(out.map((s: any) => s.id)).toEqual(["rsvp", "story", "events", "registry"]);
  });
});