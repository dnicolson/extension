import { test } from "playwright.config";

import { metadata } from "@/src/features/hideArtificialIntelligenceSummary/index.metadata";
import { expectBodyWithClass, expectBodyWithoutClass, expectElementsHidden, expectElementsNotHidden } from "@/src/utils/_tests/assertions";
import { disableFeature, enableFeature } from "@/src/utils/_tests/features";
import { navigateToPageType } from "@/src/utils/_tests/navigation";
import { resolvePageTypes } from "@/src/utils/_tests/utils";

import { hideFeatureSelectors } from "./__generated__/hideFeatureSelectors";

const {
	hideArtificialIntelligenceSummary: { bodyClass, selectors }
} = hideFeatureSelectors;

const testPages = resolvePageTypes(metadata.dependencies?.includePages);

test.describe("hideArtificialIntelligenceSummary", () => {
	for (const pageType of testPages) {
		test(`hides ai summary on ${pageType}`, async ({ page }) => {
			await navigateToPageType(page, pageType);
			await enableFeature(page, "hideArtificialIntelligenceSummary.enabled");
			await expectBodyWithClass(page, bodyClass);
			await expectElementsHidden(page, selectors);
		});
		test(`shows ai summary when disabled on ${pageType}`, async ({ page }) => {
			await navigateToPageType(page, pageType);
			await disableFeature(page, "hideArtificialIntelligenceSummary.enabled");
			await expectBodyWithoutClass(page, bodyClass);
			await expectElementsNotHidden(page, selectors);
		});
	}
});
