# How to Deploy "Journey Into My Heart"

Your project is ready for deployment! Here are the steps to get your 3D Heart website online.

## Option 1: Vercel (Recommended - Best Performance)

1.  **Push to GitHub**
    *   Since you already have this project on your computer, you need to push it to a GitHub repository first.
    *   If you haven't committed your changes:
        ```bash
        git add .
        git commit -m "Ready for deployment"
        ```
    *   Create a new repository on GitHub and link it:
        ```bash
        git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
        git branch -M main
        git push -u origin main
        ```

2.  **Deploy on Vercel**
    *   Go to [vercel.com](https://vercel.com) and sign up/login.
    *   Click **"Add New..."** -> **"Project"**.
    *   Import your GitHub repository.
    *   Vercel will detect it's a static site.
    *   Click **Deploy**.
    *   Done! You'll get a live link (e.g., `love-potti.vercel.app`) to share.

## Option 2: GitHub Pages (Easiest Integration)

1.  Go to your Repository on GitHub.
2.  Click **Settings** (top tabs).
3.  Scroll down to **Pages** (on the left sidebar).
4.  Under **Build and deployment**, select **Source** -> **Deploy from a branch**.
5.  Select **main** branch and **root** folder.
6.  Click **Save**.
7.  Wait a minute, and your site will be live at `https://your-username.github.io/your-repo-name/`.

## Troubleshooting "Photos Not Showing"

If you are testing this locally on your computer:
*   **Do NOT** just double-click `index.html`.
*   Browsers block local images for security reasons when the URL starts with `file://`.
*   **Fix:**
    *   Install the **"Live Server"** extension in VS Code.
    *   Right-click `index.html` and choose **"Open with Live Server"**.
    *   This starts a local web server (e.g., `http://127.0.0.1:5500/`), and your photos will appear!
