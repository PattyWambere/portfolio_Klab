(() => {
    const body = document.body;
    const themeButtons = document.querySelectorAll('[data-theme-toggle]');
    const storageKey = 'portfolio-theme';
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const menuOverlay = document.querySelector('[data-menu-overlay]');
    const sidebarLinks = document.querySelectorAll('.sidebar a');
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

