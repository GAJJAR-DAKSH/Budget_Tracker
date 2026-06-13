import BudgetTracker from "./BudgetTracker.js";

document.addEventListener("DOMContentLoaded", () => {

    const tracker = new BudgetTracker("#app");

    // Welcome Animation
    const cards = document.querySelectorAll(".card");

    cards.forEach((card, index) => {

        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";

        setTimeout(() => {

            card.style.transition =
                "all 0.5s ease";

            card.style.opacity = "1";
            card.style.transform =
                "translateY(0)";

        }, index * 150);

    });

    // Live Greeting

    const hour = new Date().getHours();

    let greeting = "Welcome";

    if (hour < 12) {
        greeting = "Good Morning ☀️";
    } else if (hour < 18) {
        greeting = "Good Afternoon 🌤️";
    } else {
        greeting = "Good Evening 🌙";
    }

    const title =
        document.querySelector(".header p");

    if (title) {
        title.textContent =
            `${greeting}, manage your finances smartly`;
    }

    // Search Shortcut (Ctrl + K)

    document.addEventListener(
        "keydown",
        (e) => {

            if (
                (e.ctrlKey || e.metaKey) &&
                e.key.toLowerCase() === "k"
            ) {

                e.preventDefault();

                const search =
                    document.getElementById(
                        "searchInput"
                    );

                if (search) {
                    search.focus();
                }
            }
        }
    );

    // Smooth Number Animation

    function animateValue(
        element,
        start,
        end,
        duration
    ) {

        let startTime = null;

        function animation(currentTime) {

            if (!startTime) {
                startTime = currentTime;
            }

            const progress = Math.min(
                (currentTime - startTime) /
                    duration,
                1
            );

            const value =
                start +
                (end - start) * progress;

            element.textContent =
                value.toLocaleString("en-IN");

            if (progress < 1) {
                requestAnimationFrame(
                    animation
                );
            }
        }

        requestAnimationFrame(
            animation
        );
    }

    // Future use for dashboard counters
    window.animateValue =
        animateValue;

    console.log(
        "🚀 Budget Tracker Pro Loaded Successfully"
    );

});