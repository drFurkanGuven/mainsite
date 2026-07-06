import type { Page } from "playwright";
import type { Personal } from "../models/profile.js";
import type { ScraperContext } from "./types.js";
import {
  getText,
  getAttr,
  queryFirst,
  safeNavigate,
  scrollToLoad,
} from "../utils/selectors.js";

export async function scrapePersonal(page: Page, ctx: ScraperContext): Promise<Personal> {
  await safeNavigate(page, ctx.profileUrl);
  await scrollToLoad(page, 2);

  const fullName = await getText(
    await queryFirst(page, [
      "h1.text-heading-xlarge",
      "h1.inline.t-24",
      "main h1",
      "div[data-view-name='profile-top-card'] h1",
    ])
  );

  const headline = await getText(
    await queryFirst(page, [
      "div.text-body-medium.break-words",
      "div[data-generated-suggestion-target] div.text-body-medium",
      "main .text-body-medium",
    ])
  );

  const location = await getText(
    await queryFirst(page, [
      "span.text-body-small.inline.t-black--light.break-words",
      "div.pv-top-card--list-bullet span",
      "main span.t-black--light",
    ])
  );

  const photoLoc = await queryFirst(page, [
    "img.pv-top-card-profile-picture__image",
    "button img.presence-entity__image",
    "main img[src*='profile-displayphoto']",
  ]);
  const profilePhotoUrl = await getAttr(photoLoc, "src");

  let about = "";
  const aboutSection = page.locator("section").filter({ has: page.getByText(/^About$|^Hakkında$/i) });
  if (await aboutSection.count()) {
    about = (await aboutSection.first().innerText().catch(() => ""))
      .replace(/^(About|Hakkında)\s*/i, "")
      .trim()
      .replace(/\s+/g, " ");
  }

  if (!about) {
    about = await getText(
      await queryFirst(page, [
        "div#about ~ div.display-flex div.inline-show-more-text",
        "section[data-view-name='profile-about'] div",
      ])
    );
  }

  return {
    fullName: fullName || "Unknown",
    headline,
    about,
    location,
    profilePhotoUrl,
  };
}
