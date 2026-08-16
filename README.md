# 졸업하고싶은호랭이

A BIRDS-EYE-VIEW course planning and graduation-requirement tracker for Korea University students. It displays courses from multiple semesters in one view and calculates completed credits and overall/major GPA by category.

Website: [https://horangwannagrad.com](https://horangwannagrad.com)

## Features

- View course plans from multiple semesters on one screen
- Add, edit, and delete semesters and course categories such as major requirements, major electives, and general education
- Drag courses between semesters and categories
- Calculate completed credits and GPA separately for a primary and secondary major
- Display semester GPA trends and graduation-requirement progress
- Exclude retaken or credit-withdrawn courses from completed-credit totals, summaries, and GPA calculations
- Distinguish English-taught courses and courses worth other than three credits
- Support courses worth 0.5, 1, 1.5, 2, 3, 4, 5, or 6 credits
- Support both 4.5 and 4.3 GPA scales
- Support light and dark themes
- Save plans in the browser and back them up or restore them using JSON files
- Import academic records copied from KUPID

## Importing KUPID Records

Select `KUPID 업로드` (KUPID Upload) to open two input fields.

1. In KUPID's **학기별 성적** (Grades by Semester) tab, copy everything from the first semester name through the converted score of the final semester. Paste it into the left input field.
2. In the **과목별 성적** (Grades by Course) tab, copy everything from the course code of the first course through the final course. Paste it into the right input field.
3. Select `업로드` (Upload) and review the detected number of semesters and courses.
4. If the preview is correct, confirm the import into the planner.

The importer compares each semester's attempted and earned credits with the chronological course order to determine which semester each course belongs to. Google Chrome is recommended for the most reliable copy-and-paste behavior.

> Make sure the converted score for the final semester is included. If it is missing, the importer may not recognize that semester correctly.

## Course Labels

- Regular three-credit course: no additional label
- Regular course worth other than three credits: `(1)`, `(1.5)`, etc.
- Three-credit English-taught course: `(E)`
- English-taught course worth other than three credits: `(1,E)`, `(1.5,E)`, etc.

A course marked as retaken or credit-withdrawn is displayed with a strike-through. Its name, credits, and grade remain visible, but it is excluded from completed-credit totals, summaries, and GPA calculations.

## Browser Storage and Backups

The planner automatically saves course data in browser storage through Zustand's persist middleware. The storage key is:

```text
course-planner-storage
```

No account or login is required. However, clearing browser data or switching to another browser or device can make the existing plan unavailable. Regular file backups are therefore recommended.

- `저장하기/export` (Save/Export): downloads the current semesters, categories, and courses as a JSON file.
- `불러오기/import` (Load/Import): validates a previously exported JSON file and replaces the current plan with its contents after confirmation.
- Maximum import file size: 5 MB

The default backup filename is `horang-course-plan-YYYY-MM-DD.json`.

## Running Locally

### Requirements

- Node.js
- npm
- Google Chrome recommended

### Installation

```bash
git clone <repository-url>
cd course-planner
npm install
npm run dev
```

Open the local address printed in the terminal. The default is usually:

```text
http://localhost:5173/
```

If port 5173 is already in use, Vite automatically selects another port, such as 5174. The development server refreshes the page when the source code changes. Press `Ctrl+C` to stop it.

## Available Commands

```bash
npm run dev      # Start the Vite development server
npm run build    # Type-check and create a production build
npm run lint     # Run ESLint
npm run preview  # Preview the production build locally
```

## Technology Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Zustand
- Chart.js / Recharts
- React Router

## Project Structure

```text
src/
├── components/
│   ├── About/          # About page
│   ├── CategoryRow/    # Course-category rows and editing
│   ├── Common/         # Shared dropdowns, popovers, help, and backup tools
│   ├── CourseGrid/     # Planner grid, semesters, course editor, and KUPID parsers
│   ├── Privacy/        # Privacy policy
│   └── Summary/        # Credit and GPA summaries
├── store/              # Planner, GPA-scale, and theme state
├── types/              # Shared TypeScript types
├── utils/              # Shared utilities
├── App.tsx             # Main planner and overall summaries
└── main.tsx            # Application entry point
```

## Important Notes

- The planner and its calculations are provided for reference. Always confirm official graduation requirements with the appropriate college or department.
- Deleted courses, categories, and semesters cannot be undone. Back up important plans as JSON files.
- A laptop, tablet, or other wide display is recommended when viewing many semesters and courses at once.

## Feedback

Report bugs or suggest improvements using the contact information on the website's `About/사이트 소개` page or by sending a message through Everytime.
