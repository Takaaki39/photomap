import { expect, test } from "@playwright/test";

test("主要公開ページが表示できる", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PhotoMap" })).toBeVisible();

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "プライバシーポリシー" })).toBeVisible();

  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "オフラインです" })).toBeVisible();
});

test("認証導線ページが表示できる", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Google でログイン" })).toBeVisible();

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "新規登録" })).toBeVisible();
});

test("アップロード画面に主要UIが存在する", async ({ page }) => {
  await page.goto("/upload");
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
});
