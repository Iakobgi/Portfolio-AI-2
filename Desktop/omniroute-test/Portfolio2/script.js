const header = document.getElementById("header");
const navbar = document.getElementById("navbar");
const menuToggle = document.getElementById("menu-toggle");
const themeToggle = document.getElementById("theme-toggle");

const skillsList = document.getElementById("skills-list");

const heroName = document.getElementById("hero-name");
const heroTitle = document.getElementById("hero-title");
const heroSummary = document.getElementById("hero-summary");
const terminalText = document.getElementById("terminal-text");

const aboutMyself = document.getElementById("about-myself");
const aboutGoals = document.getElementById("about-goals");
const aboutInterests = document.getElementById("about-interests");

const linkedinLink = document.getElementById("linkedin-link");
const githubLink = document.getElementById("github-link");

const contactEmail = document.getElementById("contact-email");
const contactLinkedin = document.getElementById("contact-linkedin");
const contactLocation = document.getElementById("contact-location");

const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const formSubmit = document.getElementById("form-submit");
const formFilename = document.getElementById("form-filename");
const formFirstNameInput = document.getElementById("form-first-name");
const formLastNameInput = document.getElementById("form-last-name");
const formEmailInput = document.getElementById("form-email");
const formPhoneInput = document.getElementById("form-phone");
const formRoleInput = document.getElementById("form-role");
const formCityInput = document.getElementById("form-city");
const formSubjectInput = document.getElementById("form-subject");
const formMessageInput = document.getElementById("form-message");

const footerText = document.getElementById("footer-text");
const footerEmail = document.getElementById("footer-email");
const footerLinkedin = document.getElementById("footer-linkedin");
const footerGithub = document.getElementById("footer-github");

const projectsTrack = document.getElementById("projects-track");
const projectsPrev = document.getElementById("projects-prev");
const projectsNext = document.getElementById("projects-next");

const chatbotToggle = document.getElementById("chatbot-toggle");
const chatbotWindow = document.getElementById("chatbot-window");
const chatbotClose = document.getElementById("chatbot-close");
const chatbotForm = document.getElementById("chatbot-form");
const chatbotInput = document.getElementById("chatbot-input");
const chatbotBody = document.getElementById("chatbot-body");
const chatbotToast = document.getElementById("chatbot-toast");
const chatbotToastClose = document.getElementById("chatbot-toast-close");

let portfolioData = null;
let currentLanguage = "fr";
let conversationHistory = []; // last 2 exchanges [{q, a}, ...]
let chatbotHintTimer = null;
let chatbotSpotlightTimer = null;
let chatbotHideTimer = null;
let chatbotGlowTimer = null;
let terminalTimer = null;
let terminalRunId = 0;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const languageFiles = {
    fr: "data-francais.json",
    en: "data-english.json"
};

if (menuToggle && navbar) {
    menuToggle.addEventListener("click", () => {
        const isOpen = navbar.classList.toggle("active");
        document.body.classList.toggle("menu-open", isOpen);
    });
}

document.addEventListener("click", (event) => {
    if (!navbar || !navbar.classList.contains("active")) return;
    const clickedInsideMenu = navbar.contains(event.target);
    const clickedToggle = menuToggle && menuToggle.contains(event.target);
    if (!clickedInsideMenu && !clickedToggle) {
        navbar.classList.remove("active");
        document.body.classList.remove("menu-open");
    }
});

function applyTheme(theme) {
    if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
}

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const isLight = document.documentElement.getAttribute("data-theme") === "light";
        applyTheme(isLight ? "dark" : "light");
    });
}

document.querySelectorAll(".navbar a").forEach((link) => {
    link.addEventListener("click", () => {
        if (navbar) navbar.classList.remove("active");
        document.body.classList.remove("menu-open");
    });
});

window.addEventListener("scroll", () => {
    revealOnScroll();

    if (header) {
        if (window.scrollY > 40) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    }
});

window.addEventListener("load", revealOnScroll);

function revealOnScroll() {
    const elements = document.querySelectorAll(".reveal");

    elements.forEach((element) => {
        const top = element.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) {
            element.classList.add("active");
        }
    });
}

function getNestedValue(object, path) {
    return path.split(".").reduce((value, key) => {
        if (value && Object.prototype.hasOwnProperty.call(value, key)) {
            return value[key];
        }
        return "";
    }, object);
}

function applyStaticTranslations(data) {
    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const value = getNestedValue(data, element.dataset.i18n);

        if (value !== undefined && value !== null && value !== "") {
            element.textContent = value;
        }
    });

    if (chatbotToast && sessionStorage.getItem("chatbotHintDismissed") !== "true") {
        chatbotToast.setAttribute("aria-hidden", "false");
    }

    const title = document.getElementById("page-title");
    if (title && data.ui?.siteTitle) {
        title.textContent = data.ui.siteTitle;
        document.title = data.ui.siteTitle;
    }

    if (chatbotInput && data.ui?.chatbot?.placeholder) {
        chatbotInput.placeholder = data.ui.chatbot.placeholder;
    }

    if (formFilename && data.ui?.contactForm?.filename) {
        formFilename.textContent = data.ui.contactForm.filename;
    }

    const contactJsonFilename = document.getElementById("contact-json-filename");
    if (contactJsonFilename && data.ui?.contactPage?.cardTitle) {
        contactJsonFilename.textContent = data.ui.contactPage.cardTitle;
    }

    document.documentElement.lang = currentLanguage === "fr" ? "fr" : "en";
}

/* ---------------------------------------------------------------------- */
/*  Hero terminal typing effect                                           */
/* ---------------------------------------------------------------------- */
function buildTerminalLines(data) {
    const { personal, apprenticeship, skills } = data;
    const topSkills = skills.technical.slice(0, 5).join(", ");

    return [
        { cmd: "whoami", out: personal.name },
        { cmd: "cat status.txt", out: apprenticeship.availability },
        { cmd: "ls skills/", out: topSkills },
        { cmd: "echo $LOCATION", out: personal.location }
    ];
}

async function typeLine(text, speed) {
    if (!terminalText) return;
    for (let i = 0; i <= text.length; i += 1) {
        terminalText.textContent = text.slice(0, i);
        await wait(speed);
    }
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTerminalSequence(lines, runId) {
    if (!terminalText) return;
    const outputEl = document.getElementById("terminal-output");

    for (const line of lines) {
        if (runId !== terminalRunId) return;

        if (outputEl) outputEl.textContent = "";
        await typeLine(line.cmd, 45);
        await wait(400);

        if (runId !== terminalRunId) return;
        if (outputEl) outputEl.innerHTML = `&gt; ${line.out}`;

        await wait(1600);
        if (runId !== terminalRunId) return;

        terminalText.textContent = "";
        await wait(200);
    }
}

function startTerminalTyping() {
    if (!terminalText || !portfolioData) return;

    terminalRunId += 1;
    const runId = terminalRunId;
    const lines = buildTerminalLines(portfolioData);
    const outputEl = document.getElementById("terminal-output");

    clearTimeout(terminalTimer);

    if (prefersReducedMotion) {
        terminalText.textContent = lines[0].cmd;
        if (outputEl) outputEl.innerHTML = `&gt; ${lines[0].out}`;
        return;
    }

    runTerminalSequence(lines, runId).then(() => {
        if (runId === terminalRunId) {
            terminalTimer = setTimeout(() => startTerminalTyping(), 400);
        }
    });
}

function showChatbotHint() {
    if (!chatbotToast || sessionStorage.getItem("chatbotHintDismissed") === "true") return;

    chatbotToast.classList.add("visible");
    chatbotToast.setAttribute("aria-hidden", "false");

    clearTimeout(chatbotHideTimer);
    chatbotHideTimer = setTimeout(() => {
        hideChatbotHint();
    }, 6000);
}

function hideChatbotHint() {
    if (!chatbotToast) return;

    chatbotToast.classList.remove("visible");
    chatbotToast.setAttribute("aria-hidden", "true");
    clearTimeout(chatbotHideTimer);
}

function startChatbotSpotlight() {
    if (!chatbotToggle) return;

    chatbotToggle.classList.add("chatbot-spotlight");

    clearTimeout(chatbotGlowTimer);
    chatbotGlowTimer = setTimeout(() => {
        if (chatbotToggle) {
            chatbotToggle.classList.remove("chatbot-spotlight");
        }
    }, 11000);
}

function scheduleChatbotHint() {
    if (chatbotHintTimer) {
        return;
    }

    chatbotHintTimer = setTimeout(() => {
        showChatbotHint();
    }, 3000);
}

function scheduleChatbotSpotlight() {
    if (chatbotSpotlightTimer) {
        return;
    }

    chatbotSpotlightTimer = setTimeout(() => {
        startChatbotSpotlight();
    }, 3000);
}

async function changeLanguage(lang) {
    try {
        currentLanguage = lang;
        localStorage.setItem("language", lang);

        document.querySelectorAll(".language-switcher img").forEach((img) => {
            img.classList.toggle("active", img.alt.toLowerCase().startsWith(lang === "fr" ? "fran" : "eng"));
        });

        const response = await fetch(languageFiles[lang]);

        if (!response.ok) {
            throw new Error(`Unable to load ${languageFiles[lang]}`);
        }

        portfolioData = await response.json();

        applyStaticTranslations(portfolioData);
        fillIndexPage();
        fillProjectPage();
        fillFooter();
        fillContactPage();
        startTerminalTyping();
    } catch (error) {
        console.error("Language loading error:", error);
    }
}

async function getAIReply(question) {
    try {
        const response = await fetch("https://portfolio-ai.iakobi.workers.dev/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: question,
                language: currentLanguage,
                history: conversationHistory
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return data.answer || data.error || "Erreur backend.";
        }

        return data.answer || "Erreur : aucune réponse reçue.";
    } catch (error) {
        console.error(error);
        return "L'assistant IA est temporairement indisponible.";
    }
}

function fillIndexPage() {
    if (!portfolioData || !heroName) return;

    const { personal, apprenticeship, skills, interests, projects, ui } = portfolioData;

    heroName.textContent = personal.name;
    heroTitle.textContent = personal.title;
    heroSummary.textContent = personal.summary;

    if (aboutMyself) aboutMyself.textContent = personal.myself
    if (aboutGoals) aboutGoals.textContent = `${apprenticeship.status} ${apprenticeship.goals}`;
    if (aboutInterests) aboutInterests.textContent = interests.join(", ") + ".";

    if (linkedinLink) linkedinLink.href = personal.linkedin;
    if (githubLink) githubLink.href = personal.github;

    if (contactEmail) {
        contactEmail.href = `mailto:${personal.email}`;
        const span = contactEmail.querySelector("span");
        if (span) span.textContent = personal.email;
    }

    if (contactLinkedin) {
        contactLinkedin.href = personal.linkedin;
    }

    if (contactLocation) {
        const span = contactLocation.querySelector("span");
        if (span) span.textContent = personal.location;
    }

    renderSkillsSection(skills, ui);
    renderProjectCards(projects, ui);
}

function fillFooter() {
    if (!portfolioData) return;
    const { personal } = portfolioData;

    if (footerText) footerText.textContent = `© 2026 ${personal.name} - ${personal.title}`;
    if (footerEmail) footerEmail.href = `mailto:${personal.email}`;
    if (footerLinkedin) footerLinkedin.href = personal.linkedin;
    if (footerGithub) footerGithub.href = personal.github;
}

function fillContactPage() {
    if (!portfolioData) return;
    const { personal, apprenticeship } = portfolioData;

    if (contactEmail) {
        contactEmail.href = `mailto:${personal.email}`;
        const span = contactEmail.querySelector("span");
        if (span) span.textContent = personal.email;
    }

    if (contactLinkedin) {
        contactLinkedin.href = personal.linkedin;
    }

    if (contactLocation) {
        const span = contactLocation.querySelector("span");
        if (span) span.textContent = personal.location;
    }

    renderContactJSON(personal, apprenticeship);
}

function renderContactJSON(personal, apprenticeship) {
    const el = document.getElementById("contact-json");
    if (!el) return;

    const rows = [
        ["name", personal.name],
        ["role", personal.title],
        ["location", personal.location],
        ["email", personal.email],
        ["availability", apprenticeship.availability]
    ];

    const body = rows
        .map(([key, value], index) => {
            const comma = index < rows.length - 1 ? "," : "";
            return `  <span class="json-key">"${key}"</span><span class="json-punct">:</span> <span class="json-string">"${value}"</span><span class="json-punct">${comma}</span>`;
        })
        .join("\n");

    el.innerHTML = `<span class="json-punct">{</span>\n${body}\n<span class="json-punct">}</span>`;
}

function renderSkillsSection(skills, ui) {
    if (!skillsList) return;

    const skillLookup = new Set([
        ...skills.technical,
        ...skills.learning,
        ...skills.soft
    ]);

    const commonLabels = currentLanguage === "fr"
        ? {
            frontend: "Interface & Web",
            backend: "Backend & APIs",
            ai: "IA & Données",
            devops: "DevOps & Cloud",
            systems: "Systèmes & Ingénierie",
            mindset: "Esprit & apprentissage"
        }
        : {
            frontend: "Frontend & Web",
            backend: "Backend & APIs",
            ai: "AI & Data",
            devops: "DevOps & Cloud",
            systems: "Systems & Engineering",
            mindset: "Mindset & Growth"
        };

    const skillGroups = [
        {
            id: "frontend",
            icon: "fa-display",
            label: ui.skills?.groups?.frontend || commonLabels.frontend,
            description: currentLanguage === "fr"
                ? "Interfaces, frameworks UI et applications multiplateformes"
                : "Interfaces, UI frameworks, and cross-platform apps",
            skills: ["HTML/CSS", "JavaScript", "TypeScript", "React", "Angular", "Flutter", "Dart", "UI/UX"]
        },
        {
            id: "backend",
            icon: "fa-server",
            label: ui.skills?.groups?.backend || commonLabels.backend,
            description: currentLanguage === "fr"
                ? "Logique applicative, services et accès aux données"
                : "Application logic, services, and data access",
            skills: ["PHP", "Symfony", "Node.js", "SQL", "REST APIs", "JSON"]
        },
        {
            id: "ai",
            icon: "fa-robot",
            label: ui.skills?.groups?.ai || commonLabels.ai,
            description: currentLanguage === "fr"
                ? "Intégration IA, pipelines et expérimentation"
                : "AI integration, pipelines, and experimentation",
            skills: ["Python", "AI API Integration", "Hugging Face", "Google Colab", "RAG Pipelines", "LLM APIs", "LLM orchestration", "Advanced AI agents", "AIaaS"]
        },
        {
            id: "devops",
            icon: "fa-cloud",
            label: ui.skills?.groups?.devops || commonLabels.devops,
            description: currentLanguage === "fr"
                ? "Conteneurisation, déploiement et automatisation"
                : "Containerization, deployment, and automation",
            skills: ["Docker", "Linux", "Bash", "Git/GitHub", "CI/CD", "Cloud deployment"]
        },
        {
            id: "systems",
            icon: "fa-microchip",
            label: ui.skills?.groups?.systems || commonLabels.systems,
            description: currentLanguage === "fr"
                ? "Programmation système, modélisation et développement natif"
                : "Systems programming, modeling, and native development",
            skills: ["C++", "UML", "QT Creator"]
        },
        {
            id: "mindset",
            icon: "fa-lightbulb",
            label: ui.skills?.groups?.mindset || commonLabels.mindset,
            description: currentLanguage === "fr"
                ? "Approche de travail, curiosité et capacité d’adaptation"
                : "Work approach, curiosity, and adaptability",
            skills: skills.soft
        }

    ].map((group) => ({
        ...group,
        skills: group.skills.filter((skill) => skillLookup.has(skill))
    })).filter((group) => group.skills.length > 0);

    const firstGroupId = skillGroups[0]?.id || "";

    skillsList.innerHTML = `
        <div class="skills-tab-list" role="tablist" aria-label="Skill groups">
            ${skillGroups.map((group) => `
                <button
                    type="button"
                    class="skills-tab ${group.id === firstGroupId ? "active" : ""}"
                    data-group="${group.id}"
                    role="tab"
                    aria-selected="${group.id === firstGroupId}"
                >
                    <i class="fa-solid ${group.icon}"></i>
                    <span>${group.label}</span>
                </button>
            `).join("")}
        </div>

        <div class="skills-panels">
            ${skillGroups.map((group) => `
                <article
                    class="skills-group-panel ${group.id === firstGroupId ? "active" : ""}"
                    data-group-panel="${group.id}"
                >
                    <div class="skills-group-header">
                        <div>
                            <h3 class="skills-group-title">${group.label}</h3>
                            <p class="skills-group-description">${group.description}</p>
                        </div>
                    </div>
                    <div class="skills-pills">
                        ${group.skills.map((skill) => `<span class="skill card">${skill}</span>`).join("")}
                    </div>
                </article>
            `).join("")}
        </div>
    `;

    skillsList.querySelectorAll(".skills-tab").forEach((button) => {
        button.addEventListener("click", () => {
            const targetGroup = button.dataset.group;

            skillsList.querySelectorAll(".skills-tab").forEach((tab) => {
                tab.classList.toggle("active", tab.dataset.group === targetGroup);
                tab.setAttribute("aria-selected", String(tab.dataset.group === targetGroup));
            });

            skillsList.querySelectorAll(".skills-group-panel").forEach((panel) => {
                panel.classList.toggle("active", panel.dataset.groupPanel === targetGroup);
            });
        });
    });
}

function renderProjectCards(projects, ui) {
    if (!projectsTrack || !projects) return;

    const images = ["project1.jpg", "project2.jpg", "project3.jpg", "project4.jpg", "project5.png"];
    const links = ["project1.html", "project2.html", "project3.html", "project4.html", "#"];
    const fileNames = ["portfolio.jsx", "extension.js", "chatbot.py", "client-site.html", "dashboard.ts"];
    const tagSets = currentLanguage === "fr"
        ? [
            ["Web", "Portfolio"],
            ["Confidentialité", "Extension"],
            ["IA", "Chatbot"],
            ["Freelance", "Site web", "Fiverr"],
            ["IA", "SEO", "GEO", "À venir"]
        ]
        : [
            ["Web", "Portfolio"],
            ["Privacy", "Extension"],
            ["AI", "Chatbot"],
            ["Freelance", "Website", "Fiverr"],
            ["AI", "SEO", "GEO", "Coming soon"]
        ];

    projectsTrack.innerHTML = "";

    projects.slice(0, 4).forEach((project, index) => {
        const card = document.createElement("a");
        card.href = links[index];
        card.className = "project-card";

        card.innerHTML = `
            <div class="card-chrome">
                <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
                <span class="card-filename">${fileNames[index]}</span>
            </div>
            <div class="project-image-wrap">
                <img src="${images[index]}" alt="${project.name}" loading="lazy" decoding="async" />
            </div>
            <div class="project-content">
                <div class="project-tags">
                    ${tagSets[index].map((tag) => `<span>${tag}</span>`).join("")}
                </div>
                <h3>${project.name}</h3>
                <p>${project.shortDescription}</p>
                <span class="project-link-text">
                    ${ui.projects.seeDetails} <i class="fa-solid fa-arrow-right"></i>
                </span>
            </div>
        `;

        projectsTrack.appendChild(card);
    });

    const lockedProject = projects[4];
    if (lockedProject) {
        const lockedCard = document.createElement("div");
        lockedCard.className = "project-card locked-project";

        lockedCard.innerHTML = `
            <div class="card-chrome">
                <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
                <span class="card-filename">${fileNames[4]}</span>
            </div>
            <div class="project-image-wrap">
                <img src="${images[4]}" alt="${lockedProject.name}" loading="lazy" decoding="async" />
            </div>
            <div class="project-content">
                <div class="project-tags">
                    <span>${ui.projects.locked}</span>
                    <span>${ui.projects.comingSoonTag}</span>
                </div>
                <h3>${lockedProject.name}</h3>
                <p>${lockedProject.description}</p>
                <span class="project-link-text locked-text">
                    ${ui.projects.comingSoon} <i class="fa-solid fa-lock"></i>
                </span>
            </div>
        `;

        projectsTrack.appendChild(lockedCard);
    }
}

function fillProjectPage() {
    if (!portfolioData) return;

    const projectPage = document.querySelector("[data-project-index]");
    if (!projectPage) return;

    const index = Number(projectPage.dataset.projectIndex);
    const data = portfolioData.projectPages?.[index];

    if (!data) return;

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    setText("project-eyebrow", data.eyebrow);
    setText("project-title", data.title);
    setText("project-subtitle", data.subtitle);
    setText("project-description-title", data.descriptionTitle);
    setText("project-description", data.description);
    setText("project-technologies-title", data.technologiesTitle);
    setText("project-technologies", data.technologies);
    setText("project-learned-title", data.learnedTitle);
    setText("project-learned", data.learned);

    const image = document.getElementById("project-image");
    if (image) {
        image.alt = data.imageAlt;
    }

    const sourceButton = document.getElementById("source-code-button");
    if (sourceButton) sourceButton.textContent = portfolioData.ui.buttons.sourceCode;

    const previewButton = document.getElementById("live-preview-button");
    if (previewButton) previewButton.textContent = portfolioData.ui.buttons.livePreview;

    const comingButton = document.getElementById("coming-soon-button");
    if (comingButton) comingButton.textContent = portfolioData.ui.buttons.comingSoon;
}

function getScrollAmount() {
    if (!projectsTrack) return 300;

    const card = projectsTrack.querySelector(".project-card");
    if (!card) return 300;

    return card.offsetWidth + 24;
}

if (projectsPrev && projectsTrack) {
    projectsPrev.addEventListener("click", () => {
        projectsTrack.scrollBy({
            left: -getScrollAmount(),
            behavior: "smooth"
        });
    });
}

if (projectsNext && projectsTrack) {
    projectsNext.addEventListener("click", () => {
        projectsTrack.scrollBy({
            left: getScrollAmount(),
            behavior: "smooth"
        });
    });
}

if (chatbotToggle && chatbotWindow) {
    chatbotToggle.addEventListener("click", () => {
        hideChatbotHint();
        chatbotWindow.classList.toggle("active");
    });
}

if (chatbotClose && chatbotWindow) {
    chatbotClose.addEventListener("click", () => {
        chatbotWindow.classList.remove("active");
    });
}

// FIX: Toast close button now only closes the toast, does not open chatbot
if (chatbotToastClose) {
    chatbotToastClose.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent click from bubbling to the toast container
        hideChatbotHint();
        sessionStorage.setItem("chatbotHintDismissed", "true");
    });
}

if (chatbotToast) {
    chatbotToast.addEventListener("click", () => {
        if (chatbotWindow) {
            chatbotWindow.classList.add("active");
        }
        hideChatbotHint();
    });
}

function addMessage(text, type) {
    if (!chatbotBody) return;

    const message = document.createElement("div");
    message.className = type === "user" ? "user-message" : "bot-message";
    message.innerHTML = `<p>${text}</p>`;
    chatbotBody.appendChild(message);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
}

function getBotReply(question) {
    if (!portfolioData) {
        return currentLanguage === "fr"
            ? "Les données du profil sont encore en chargement. Réessayez dans un instant."
            : "My profile data is still loading. Please try again in a second.";
    }

    const text = question.toLowerCase();
    const { personal, apprenticeship, skills, education, experience, projects, languages, interests, ui } = portfolioData;

    if (text.includes("name") || text.includes("nom") || text.includes("who are you") || text.includes("qui es")) {
        return `${personal.name} - ${personal.title}.`;
    }

    if (text.includes("about") || text.includes("summary") || text.includes("profile") || text.includes("profil") || text.includes("présentation")) {
        return personal.summary;
    }

    if (text.includes("email") || text.includes("contact") || text.includes("reach") || text.includes("contacter")) {
        return currentLanguage === "fr"
            ? `Vous pouvez contacter ${personal.name} à cette adresse : <a href="mailto:${personal.email}">${personal.email}</a>.`
            : `You can contact ${personal.name} at <a href="mailto:${personal.email}">${personal.email}</a>.`;
    }

    if (text.includes("linkedin")) {
        return currentLanguage === "fr"
            ? `Voici son profil LinkedIn : <a href="${personal.linkedin}" target="_blank">${personal.linkedin}</a>`
            : `Here is the LinkedIn profile: <a href="${personal.linkedin}" target="_blank">${personal.linkedin}</a>`;
    }

    if (text.includes("github")) {
        return currentLanguage === "fr"
            ? `Voici son GitHub : <a href="${personal.github}" target="_blank">${personal.github}</a>`
            : `Here is the GitHub profile: <a href="${personal.github}" target="_blank">${personal.github}</a>`;
    }

    if (text.includes("location") || text.includes("where") || text.includes("based") || text.includes("où") || text.includes("localisation")) {
        return currentLanguage === "fr"
            ? `${personal.name} est basé à ${personal.location}.`
            : `${personal.name} is based in ${personal.location}.`;
    }

    if (text.includes("apprenticeship") || text.includes("alternance") || text.includes("looking for") || text.includes("recherche")) {
        return `${apprenticeship.status} ${apprenticeship.goals}`;
    }

    if (text.includes("availability") || text.includes("available") || text.includes("disponible") || text.includes("disponibilité")) {
        return apprenticeship.availability;
    }

    if (text.includes("skill") || text.includes("technologies") || text.includes("tech stack") || text.includes("compétence") || text.includes("technos")) {
        return currentLanguage === "fr"
            ? `Compétences techniques : ${skills.technical.join(", ")}. En apprentissage : ${skills.learning.join(", ")}.`
            : `Technical skills: ${skills.technical.join(", ")}. Currently learning: ${skills.learning.join(", ")}.`;
    }

    if (text.includes("soft")) {
        return currentLanguage === "fr"
            ? `Qualités : ${skills.soft.join(", ")}.`
            : `Soft skills: ${skills.soft.join(", ")}.`;
    }

    if (text.includes("education") || text.includes("school") || text.includes("study") || text.includes("training") || text.includes("formation") || text.includes("école")) {
        const item = education[0];
        return `${item.degree} - ${item.school} (${item.year}). ${item.details}`;
    }

    if (text.includes("experience") || text.includes("work") || text.includes("expérience") || text.includes("travail")) {
        const item = experience[0];
        return `${item.role} - ${item.company} (${item.year}). ${item.details}`;
    }

    if (text.includes("project") || text.includes("built") || text.includes("projet")) {
        return currentLanguage === "fr"
            ? `Ses projets incluent : ${projects.map((project) => project.name).join(", ")}.`
            : `Projects include: ${projects.map((project) => project.name).join(", ")}.`;
    }

    if (text.includes("chrome") || text.includes("extension") || text.includes("tracker") || text.includes("cookie")) {
        const item = projects.find((project) =>
            project.name.toLowerCase().includes("extension") ||
            project.name.toLowerCase().includes("navigation") ||
            project.name.toLowerCase().includes("browsing")
        );
        if (item) return `${item.name}: ${item.description}`;
    }

    if (text.includes("portfolio")) {
        const item = projects.find((project) =>
            project.name.toLowerCase().includes("portfolio")
        );
        if (item) return `${item.name}: ${item.description}`;
    }

    if (text.includes("chatbot")) {
        const item = projects.find((project) =>
            project.name.toLowerCase().includes("chatbot")
        );
        if (item) return `${item.name}: ${item.description}`;
    }

    if (text.includes("language") || text.includes("langue")) {
        return currentLanguage === "fr"
            ? `Langues : ${languages.join(", ")}.`
            : `Languages: ${languages.join(", ")}.`;
    }

    if (text.includes("hobbies") || text.includes("interests") || text.includes("loisir") || text.includes("intérêt")) {
        return currentLanguage === "fr"
            ? `Centres d’intérêt : ${interests.join(", ")}.`
            : `Interests: ${interests.join(", ")}.`;
    }

    if (text.includes("cv") || text.includes("resume")) {
        return currentLanguage === "fr"
            ? `Vous pouvez télécharger le CV en haut de la page, ou <a href="cv.pdf" download>cliquer ici</a>.`
            : `You can download the CV at the top of the page, or <a href="cv.pdf" download>click here</a>.`;
    }

    if (text.includes("hire") || text.includes("why") || text.includes("recruter") || text.includes("pourquoi")) {
        return currentLanguage === "fr"
            ? `${personal.name} est motivé, curieux, et recherche une alternance pour progresser tout en contribuant à de vrais projets.`
            : `${personal.name} is motivated, curious, and currently looking for an apprenticeship where he can grow and contribute to real projects.`;
    }

    return ui?.chatbot?.fallback || "I do not have that exact information yet.";
}

function sendChatbotQuestion(question) {
    const cleanedQuestion = question.trim();
    if (cleanedQuestion === "") return;

    addMessage(cleanedQuestion, "user");

    setTimeout(async () => {
        const answer = await getAIReply(cleanedQuestion);
        addMessage(answer, "bot");
        conversationHistory.push({ q: cleanedQuestion, a: answer });
        if (conversationHistory.length > 2) conversationHistory.shift();
    }, 250);

    if (chatbotInput) {
        chatbotInput.value = "";
    }
}

if (chatbotForm && chatbotInput) {
    chatbotForm.addEventListener("submit", (event) => {
        event.preventDefault();
        sendChatbotQuestion(chatbotInput.value);
    });
}

function setFormStatus(text, type) {
    if (!formStatus) return;
    formStatus.textContent = text || "";
    formStatus.className = "form-status" + (type ? ` ${type}` : "");
}

function markFieldError(input, isError) {
    if (!input) return;
    input.classList.toggle("field-error", isError);
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        const copy = portfolioData?.ui?.contactForm || {};
        const firstName = formFirstNameInput?.value.trim() || "";
        const lastName = formLastNameInput?.value.trim() || "";
        const email = formEmailInput?.value.trim() || "";
        const subject = formSubjectInput?.value.trim() || "";
        const message = formMessageInput?.value.trim() || "";

        const missing = !firstName || !lastName || !email || !subject || !message;
        markFieldError(formFirstNameInput, !firstName);
        markFieldError(formLastNameInput, !lastName);
        markFieldError(formEmailInput, !email);
        markFieldError(formSubjectInput, !subject);
        markFieldError(formMessageInput, !message);

        if (missing) {
            event.preventDefault();
            setFormStatus(copy.error || "Please fill in every required field before sending.", "error");
            return;
        }

        if (!isValidEmail(email)) {
            event.preventDefault();
            markFieldError(formEmailInput, true);
            setFormStatus(copy.errorInvalidEmail || "Please enter a valid email address.", "error");
            return;
        }

        // Validation passed: do not preventDefault. Let the browser submit the
        // form natively so Netlify can intercept and process it server-side,
        // then redirect to the form's `action` (thank-you.html). This avoids
        // every AJAX/fetch-related failure mode (redirect rules, content-type
        // quirks, etc.) that can break Netlify Forms on a live deployment.
        if (formSubmit) formSubmit.disabled = true;
        setFormStatus(copy.sending || "Sending…", "");
    });

    [
        formFirstNameInput,
        formLastNameInput,
        formEmailInput,
        formPhoneInput,
        formRoleInput,
        formCityInput,
        formSubjectInput,
        formMessageInput
    ].forEach((input) => {
        if (!input) return;
        input.addEventListener("input", () => markFieldError(input, false));
    });
}

document.querySelectorAll(".chatbot-suggestion").forEach((button) => {
    button.addEventListener("click", () => {
        sendChatbotQuestion(button.textContent.trim());
    });
});

document.addEventListener("DOMContentLoaded", () => {
    scheduleChatbotHint();
    scheduleChatbotSpotlight();

    const savedLanguage = localStorage.getItem("language") || "fr";
    changeLanguage(savedLanguage);
});