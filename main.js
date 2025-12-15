(() => {
    const body = document.body;
    const themeButtons = document.querySelectorAll('[data-theme-toggle]');
    const storageKey = 'portfolio-theme';
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const menuOverlay = document.querySelector('[data-menu-overlay]');
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    let dismissProjectModal = null;
    menuToggle?.setAttribute('aria-expanded', 'false');

    const getStoredTheme = () => {
        try {
            return localStorage.getItem(storageKey);
        } catch (error) {
            console.warn('Local storage unavailable:', error);
            return null;
        }
    };

    const storeTheme = (theme) => {
        try {
            localStorage.setItem(storageKey, theme);
        } catch (error) {
            console.warn('Unable to persist theme preference:', error);
        }
    };

    const setTheme = (mode) => {
        if (mode === 'light') {
            body.setAttribute('data-theme', 'light');
        } else {
            body.removeAttribute('data-theme');
        }
        storeTheme(mode);
        syncThemeButtons();
    };

    const syncThemeButtons = () => {
        const isLight = body.getAttribute('data-theme') === 'light';
        themeButtons.forEach((btn) => {
            const label = isLight ? 'Dark Mode' : 'Light Mode';
            btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
            btn.setAttribute('aria-label', `Switch to ${label}`);
            const span = btn.querySelector('span');
            if (span) {
                span.textContent = label;
            }
        });
    };

    const initTheme = () => {
        const storedTheme = getStoredTheme();
        if (storedTheme === 'light') {
            body.setAttribute('data-theme', 'light');
        } else if (storedTheme === 'dark') {
            body.removeAttribute('data-theme');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            body.setAttribute('data-theme', 'light');
        }
        syncThemeButtons();
    };

    themeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const isLight = body.getAttribute('data-theme') === 'light';
            setTheme(isLight ? 'dark' : 'light');
        });
    });

    initTheme();

    // Mobile menu handling
    const toggleMenu = (forceState) => {
        const isOpen = body.getAttribute('data-menu-open') === 'true';
        const nextState = typeof forceState === 'boolean' ? forceState : !isOpen;
        if (nextState) {
            body.setAttribute('data-menu-open', 'true');
            menuToggle?.setAttribute('aria-expanded', 'true');
        } else {
            body.removeAttribute('data-menu-open');
            menuToggle?.setAttribute('aria-expanded', 'false');
        }
    };

    menuToggle?.addEventListener('click', () => toggleMenu());
    menuOverlay?.addEventListener('click', () => toggleMenu(false));

    sidebarLinks.forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1080) {
                toggleMenu(false);
            }
        });
    });

    themeButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            if (window.innerWidth <= 1080) {
                toggleMenu(false);
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 1080) {
            toggleMenu(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            toggleMenu(false);
            if (typeof dismissProjectModal === 'function') {
                dismissProjectModal();
            }
        }
    });

    // Portfolio filtering
    const filterButtons = document.querySelectorAll('[data-filter]');
    const portfolioItems = document.querySelectorAll('[data-portfolio-item]');

    if (filterButtons.length && portfolioItems.length) {
        const changeFilter = (category) => {
            portfolioItems.forEach((item) => {
                const categories = item.dataset.category?.split(' ') || [];
                const matches = category === 'all' || categories.includes(category);
                item.classList.toggle('hidden', !matches);
            });
        };

        const activateButton = (target) => {
            filterButtons.forEach((btn) => btn.classList.toggle('active', btn === target));
        };

        filterButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const selected = button.dataset.filter;
                activateButton(button);
                changeFilter(selected);
            });
        });

        changeFilter('all');
    }

    // Portfolio modal
    const projectModal = document.querySelector('[data-project-modal]');
    if (projectModal) {
        const projectTitle = projectModal.querySelector('[data-project-title]');
        const projectSubtitle = projectModal.querySelector('[data-project-subtitle]');
        const projectDescription = projectModal.querySelector('[data-project-description]');
        const projectTools = projectModal.querySelector('[data-project-tools]');
        const projectCategory = projectModal.querySelector('[data-project-category]');
        const projectImage = projectModal.querySelector('[data-project-image]');
        const projectDemo = projectModal.querySelector('[data-project-demo]');
        const projectRepo = projectModal.querySelector('[data-project-repo]');
        const closeButtons = projectModal.querySelectorAll('[data-project-close], [data-project-close-secondary]');

        const formatCategories = (value) =>
            value
                .split(' ')
                .filter(Boolean)
                .map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1))
                .join(', ');

        const closeModal = () => {
            projectModal.classList.remove('active');
            body.removeAttribute('data-project-open');
        };

        dismissProjectModal = closeModal;

        const openModal = (item) => {
            const dataset = item.dataset;
            projectTitle.textContent = dataset.title || 'Project';
            projectSubtitle.textContent = dataset.subtitle || '';
            projectDescription.textContent = dataset.description || 'Case study coming soon.';
            projectTools.textContent = dataset.tools || '';
            projectCategory.textContent = dataset.category ? formatCategories(dataset.category) : 'Project';

            const imageSrc = dataset.image || item.querySelector('img')?.getAttribute('src');
            if (imageSrc) {
                projectImage.src = imageSrc;
                projectImage.alt = dataset.title || 'Project preview';
            }

            const setCta = (el, href, fallbackText) => {
                if (!el) return;
                const safeHref = href && href !== '#' ? href : '#';
                el.href = safeHref;
                el.target = safeHref === '#' ? '_self' : '_blank';
                el.textContent = safeHref === '#' ? fallbackText : el.dataset.label || fallbackText;
                el.classList.toggle('disabled', safeHref === '#');
            };

            const hasDemo = dataset.demo && dataset.demo !== '#';
            const hasRepo = dataset.repo && dataset.repo !== '#';

            if (projectDemo) {
                projectDemo.dataset.label = hasDemo ? 'Open demo' : 'Demo coming soon';
            }
            if (projectRepo) {
                projectRepo.dataset.label = hasRepo ? 'View repo' : 'Repo coming soon';
            }

            setCta(projectDemo, dataset.demo, 'Demo coming soon');
            setCta(projectRepo, dataset.repo, 'Repo coming soon');

            projectModal.classList.add('active');
            body.setAttribute('data-project-open', 'true');
        };

        const triggers = document.querySelectorAll('[data-project-trigger]');
        triggers.forEach((trigger) => {
            trigger.addEventListener('click', () => {
                const parent = trigger.closest('[data-portfolio-item]');
                if (parent) {
                    openModal(parent);
                }
            });
        });

        closeButtons.forEach((btn) => btn.addEventListener('click', closeModal));
        projectModal.addEventListener('click', (event) => {
            if (event.target === projectModal) {
                closeModal();
            }
        });
    }

    // Contact form submission via Formspree (or similar)
    const contactForm = document.querySelector('[data-contact-form]');
    if (contactForm) {
        const statusEl = contactForm.querySelector('[data-form-status]');
        const submitBtn = contactForm.querySelector('[data-form-submit]');
        const endpoint = contactForm.dataset.endpoint;

        const setStatus = (message, type = 'info') => {
            if (!statusEl) {
                return;
            }
            statusEl.textContent = message;
            statusEl.classList.remove('success', 'error');
            if (type === 'success') {
                statusEl.classList.add('success');
            } else if (type === 'error') {
                statusEl.classList.add('error');
            }
        };

        const validateField = (el) => {
            if (el.required && !el.value.trim()) {
                return `${el.placeholder || el.name} is required.`;
            }
            if (el.name === '_replyto') {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(el.value.trim())) {
                    return 'Please enter a valid email.';
                }
            }
            if (el.name === 'message' && el.value.trim().length < 10) {
                return 'Message should be at least 10 characters.';
            }
            return null;
        };

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!endpoint || endpoint.includes('YOUR_FORM_ID')) {
                setStatus('Form endpoint not configured. Please update data-endpoint.', 'error');
                return;
            }

            const fields = Array.from(contactForm.querySelectorAll('input, textarea')).filter((el) =>
                ['name', '_replyto', 'message'].includes(el.name)
            );

            for (const field of fields) {
                const error = validateField(field);
                if (error) {
                    setStatus(error, 'error');
                    field.focus();
                    return;
                }
            }

            const honeypot = contactForm.querySelector('[name=\"_gotcha\"]');
            if (honeypot && honeypot.value) {
                return;
            }

            setStatus('Sending message...');
            if (submitBtn) {
                submitBtn.disabled = true;
            }

            try {
                const formData = new FormData(contactForm);
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Failed to send message. Please try again.');
                }

                setStatus('Thanks! I will get back to you shortly.', 'success');
                contactForm.reset();
            } catch (error) {
                console.error(error);
                setStatus(error.message || 'Something went wrong. Please email me directly.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                }
            }
        });
    }
})();

