# Configure Filter Conditions Dialog Size Update

## Change Summary
Updated the Configure Filter Conditions dialog to be larger for better usability when working with complex search conditions.

## Size Changes

### Before:
- Max width: `max-w-4xl` (56rem / 896px)
- Max height: `max-h-[80vh]`
- No fixed width or height

### After:
- Max width: `max-w-6xl` (72rem / 1152px)
- Width: `w-[90vw]` (90% of viewport width)
- Max height: `max-h-[90vh]` (90% of viewport height)
- Height: `h-[85vh]` (85% of viewport height)

## Benefits:
1. **More horizontal space** - Better for the two-column layout (Condition Builder and Expression Preview)
2. **More vertical space** - Allows more conditions to be visible without scrolling
3. **Responsive sizing** - Uses viewport units to adapt to different screen sizes
4. **Better aspect ratio** - The dialog is now more proportional for complex condition building

## Visual Impact:
- The dialog now takes up most of the screen (90% width, 85% height)
- Still maintains margins to avoid feeling cramped
- Provides significantly more working space for building complex search conditions
- The two-column layout (Condition Builder and Expression Preview) has more breathing room