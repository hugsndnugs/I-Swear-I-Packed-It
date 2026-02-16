import { test, expect } from '@playwright/test'

test.describe('Home to Checklist flow', () => {
  test('navigates from Home to Generate to Checklist', async ({ page }) => {
    await page.goto('/')

    // Verify we're on the home page
    await expect(page).toHaveTitle(/Pre-Flight Assistant/i)
    await expect(page.locator('h1')).toContainText(/Pre-Flight Assistant/i)

    // Click "Start Pre-Flight" button
    const startButton = page.getByRole('button', { name: /start pre-flight/i })
    await expect(startButton).toBeVisible()
    await startButton.click()

    // Should navigate to Generate page
    await expect(page).toHaveURL(/\/generate/)
    await expect(page.locator('h1')).toContainText(/Generate Checklist/i)

    // Select a ship (Cutlass Black)
    const shipSelect = page.locator('select').first()
    await shipSelect.selectOption({ value: 'cutlass-black' })

    // Select operation type (Cargo run)
    const cargoRunButton = page.getByRole('button', { name: /cargo run/i })
    await cargoRunButton.click()

    // Ensure at least one crew member (pilot)
    const pilotInput = page.getByLabel(/pilot/i).or(page.locator('input[aria-label*="Pilot"]'))
    await pilotInput.fill('1')

    // Click Generate button
    const generateButton = page.getByRole('button', { name: /generate/i })
    await generateButton.click()

    // Should navigate to Checklist page
    await expect(page).toHaveURL(/\/checklist/)
    await expect(page.locator('h1')).toContainText(/Pre-Flight Checklist/i)
  })

  test('preset import flow', async ({ page }) => {
    await page.goto('/')

    // Find import section
    const importInput = page.getByPlaceholder(/paste code or link/i)
    await expect(importInput).toBeVisible()

    // Note: In a real test, you'd use a valid encoded preset
    // For now, we'll just verify the input exists and is accessible
    await importInput.fill('test-preset-code')
    
    const openButton = page.getByRole('button', { name: /open/i })
    await expect(openButton).toBeVisible()
  })

  test('quick-start with last run', async ({ page }) => {
    // First, create a last run by going through the flow
    await page.goto('/')
    const startButton = page.getByRole('button', { name: /start pre-flight/i })
    await startButton.click()

    await page.locator('select').first().selectOption({ value: 'cutlass-black' })
    await page.getByRole('button', { name: /cargo run/i }).click()
    const pilotInput = page.getByLabel(/pilot/i).or(page.locator('input[aria-label*="Pilot"]'))
    await pilotInput.fill('1')
    await page.getByRole('button', { name: /generate/i }).click()

    // Go back to home
    await page.goto('/')

    // Quick-start button should be visible
    const quickStartButton = page.getByRole('button', { name: /quick-start/i })
    await expect(quickStartButton).toBeVisible()
  })
})
