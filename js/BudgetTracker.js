export default class BudgetTracker {

    constructor(querySelectorString) {

        this.root = document.querySelector(querySelectorString);
        this.chart = null;

        this.root.innerHTML = BudgetTracker.html();

        this.root.querySelector(".new-entry")
            .addEventListener("click", () => {
                this.addEntry();
            });

        document
            .getElementById("themeToggle")
            ?.addEventListener("click", () => {
                this.toggleTheme();
            });

        document
            .getElementById("exportCSV")
            ?.addEventListener("click", () => {
                this.exportCSV();
            });

        document
            .getElementById("downloadPDF")
            ?.addEventListener("click", () => {
                this.downloadPDF();
            });

        document
            .getElementById("searchInput")
            ?.addEventListener("input", (e) => {
                this.filterEntries(e.target.value);
            });

        this.loadTheme();
        this.load();
    }

    static html() {

        return `
            <table class="budget-tracker">

                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody class="entries"></tbody>

                <tbody>
                    <tr>
                        <td colspan="6" class="controls">
                            <button class="new-entry">
                                + Add Transaction
                            </button>
                        </td>
                    </tr>
                </tbody>

                <tfoot>
                    <tr>
                        <td colspan="6" class="summary">
                            <strong>Total Balance:</strong>
                            <span class="total">₹0</span>
                        </td>
                    </tr>
                </tfoot>

            </table>
        `;
    }

    static entryHtml() {

        return `
            <tr>

                <td>
                    <input class="input input-date" type="date">
                </td>

                <td>
                    <input class="input input-description"
                    placeholder="Description">
                </td>

                <td>
                    <select class="input input-category">

                        <option value="Food">🍔 Food</option>
                        <option value="Travel">✈️ Travel</option>
                        <option value="Shopping">🛍️ Shopping</option>
                        <option value="Bills">📄 Bills</option>
                        <option value="Salary">💰 Salary</option>
                        <option value="Investment">📈 Investment</option>
                        <option value="Entertainment">🎬 Entertainment</option>
                        <option value="Other">📌 Other</option>

                    </select>
                </td>

                <td>
                    <select class="input input-type">
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </td>

                <td>
                    <input class="input input-amount"
                    type="number">
                </td>

                <td>
                    <button class="delete-entry">
                        ✕
                    </button>
                </td>

            </tr>
        `;
    }

    load() {

        const entries = JSON.parse(
            localStorage.getItem("budget-tracker-pro") || "[]"
        );

        if (!entries.length) {
            this.showEmptyState(true);
        }

        entries.forEach(entry => {
            this.addEntry(entry);
        });

        this.updateAll();
    }

    save() {

        const data = this.getEntryRows().map(row => {

            return {
                date:
                    row.querySelector(".input-date").value,

                description:
                    row.querySelector(".input-description").value,

                category:
                    row.querySelector(".input-category").value,

                type:
                    row.querySelector(".input-type").value,

                amount:
                    Number(
                        row.querySelector(".input-amount").value
                    ) || 0
            };

        });

        localStorage.setItem(
            "budget-tracker-pro",
            JSON.stringify(data)
        );

        this.updateAll();
    }

    updateAll() {

        this.updateSummary();
        this.updateAnalytics();
        this.updateActivity();
        this.updateChart();
        this.showEmptyState(
            this.getEntryRows().length === 0
        );
    }

    updateSummary() {

        let income = 0;
        let expense = 0;

        this.getEntryRows().forEach(row => {

            const amount =
                Number(
                    row.querySelector(".input-amount").value
                ) || 0;

            const type =
                row.querySelector(".input-type").value;

            if (type === "income") {
                income += amount;
            } else {
                expense += amount;
            }

        });

        const balance = income - expense;

        document.getElementById(
            "incomeAmount"
        ).textContent =
            this.currency(income);

        document.getElementById(
            "expenseAmount"
        ).textContent =
            this.currency(expense);

        document.getElementById(
            "balanceAmount"
        ).textContent =
            this.currency(balance);

        this.root.querySelector(".total")
            .textContent =
            this.currency(balance);
    }

    updateAnalytics() {

        const rows = this.getEntryRows();

        let highestIncome = 0;
        let highestExpense = 0;

        let income = 0;
        let expense = 0;

        rows.forEach(row => {

            const amount =
                Number(
                    row.querySelector(".input-amount").value
                ) || 0;

            const type =
                row.querySelector(".input-type").value;

            if (type === "income") {

                income += amount;
                highestIncome =
                    Math.max(
                        highestIncome,
                        amount
                    );

            } else {

                expense += amount;
                highestExpense =
                    Math.max(
                        highestExpense,
                        amount
                    );

            }

        });

        document.getElementById(
            "transactionCount"
        ).textContent =
            rows.length;

        document.getElementById(
            "highestIncome"
        ).textContent =
            this.currency(highestIncome);

        document.getElementById(
            "highestExpense"
        ).textContent =
            this.currency(highestExpense);

        document.getElementById(
            "monthlySavings"
        ).textContent =
            this.currency(
                income - expense
            );
    }

    updateChart() {

        const categories = {};

        this.getEntryRows().forEach(row => {

            const type =
                row.querySelector(".input-type").value;

            if (type !== "expense") return;

            const category =
                row.querySelector(".input-category").value;

            const amount =
                Number(
                    row.querySelector(".input-amount").value
                ) || 0;

            categories[category] =
                (categories[category] || 0)
                + amount;

        });

        const ctx =
            document.getElementById(
                "expenseChart"
            );

        if (!ctx) return;

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {

            type: "pie",

            data: {

                labels:
                    Object.keys(categories),

                datasets: [{
                    data:
                        Object.values(categories)
                }]
            }

        });
    }

    updateActivity() {

        const container =
            document.getElementById(
                "recentActivity"
            );

        if (!container) return;

        const rows =
            [...this.getEntryRows()]
            .slice(-5)
            .reverse();

        if (!rows.length) {

            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        📊
                    </div>
                    <h3>No Activity Yet</h3>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        rows.forEach(row => {

            const category =
                row.querySelector(
                    ".input-category"
                ).value;

            const amount =
                row.querySelector(
                    ".input-amount"
                ).value;

            const description =
                row.querySelector(
                    ".input-description"
                ).value;

            container.insertAdjacentHTML(
                "beforeend",
                `
                <div class="activity-item">

                    <div class="activity-icon">
                        ${this.icon(category)}
                    </div>

                    <div class="activity-info">
                        <h4>${description || category}</h4>
                        <p>${this.currency(amount)}</p>
                    </div>

                </div>
                `
            );

        });
    }

    exportCSV() {

        const entries =
            JSON.parse(
                localStorage.getItem(
                    "budget-tracker-pro"
                ) || "[]"
            );

        let csv =
            "Date,Description,Category,Type,Amount\n";

        entries.forEach(entry => {

            csv +=
                `${entry.date},${entry.description},${entry.category},${entry.type},${entry.amount}\n`;

        });

        const blob =
            new Blob([csv], {
                type: "text/csv"
            });

        const link =
            document.createElement("a");

        link.href =
            URL.createObjectURL(blob);

        link.download =
            "budget-report.csv";

        link.click();
    }

    downloadPDF() {

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    let y = 20;

    const rows = this.getEntryRows();

    let income = 0;
    let expense = 0;

    rows.forEach(row => {

        const amount =
            Number(
                row.querySelector(".input-amount").value
            ) || 0;

        const type =
            row.querySelector(".input-type").value;

        if (type === "income") {
            income += amount;
        } else {
            expense += amount;
        }

    });

    const balance = income - expense;

    /* HEADER */

    pdf.setFillColor(59,130,246);
    pdf.rect(0,0,210,30,"F");

    pdf.setTextColor(255,255,255);
    pdf.setFontSize(22);
    pdf.text("Budget Tracker Report",20,20);

    pdf.setTextColor(0,0,0);

    y = 45;

    /* REPORT INFO */

    pdf.setFontSize(11);

    pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        20,
        y
    );

    y += 15;

    /* SUMMARY */

    pdf.setFontSize(16);
    pdf.text("Financial Summary",20,y);

    y += 10;

    pdf.setDrawColor(220);

    pdf.roundedRect(20,y,170,30,3,3);

    pdf.setFontSize(12);

    pdf.text(
        `Income : ${this.currency(income)}`,
        25,
        y + 10
    );

    pdf.text(
        `Expense : ${this.currency(expense)}`,
        25,
        y + 20
    );

    pdf.text(
        `Balance : ${this.currency(balance)}`,
        100,
        y + 15
    );

    y += 45;

    /* TRANSACTIONS */

    pdf.setFontSize(16);
    pdf.text("Transactions",20,y);

    y += 10;

    pdf.setFillColor(240,240,240);
    pdf.rect(20,y,170,8,"F");

    pdf.setFontSize(10);

    pdf.text("Date",22,y+5);
    pdf.text("Description",50,y+5);
    pdf.text("Type",105,y+5);
    pdf.text("Category",130,y+5);
    pdf.text("Amount",165,y+5);

    y += 12;

    rows.forEach(row => {

        const date =
            row.querySelector(".input-date").value;

        const description =
            row.querySelector(".input-description").value;

        const category =
            row.querySelector(".input-category").value;

        const type =
            row.querySelector(".input-type").value;

        const amount =
            row.querySelector(".input-amount").value;

        pdf.text(date,22,y);

        pdf.text(
            description.substring(0,18),
            50,
            y
        );

        pdf.text(type,105,y);

        pdf.text(category,130,y);

        pdf.text(
            `₹${amount}`,
            165,
            y
        );

        y += 8;

        if(y > 270){

            pdf.addPage();

            y = 20;

            pdf.setFillColor(240,240,240);
            pdf.rect(20,y,170,8,"F");

            pdf.text("Date",22,y+5);
            pdf.text("Description",50,y+5);
            pdf.text("Type",105,y+5);
            pdf.text("Category",130,y+5);
            pdf.text("Amount",165,y+5);

            y += 12;
        }

    });

    pdf.save(
        `Budget_Report_${new Date().toISOString().split("T")[0]}.pdf`
    );
}

    toggleTheme() {

        document.body.classList
            .toggle("light-theme");

        localStorage.setItem(
            "theme",
            document.body.classList
                .contains("light-theme")
                ? "light"
                : "dark"
        );
    }

    loadTheme() {

        const theme =
            localStorage.getItem("theme");

        if (theme === "light") {

            document.body.classList
                .add("light-theme");
        }
    }

    addEntry(entry = {}) {

        this.root
            .querySelector(".entries")
            .insertAdjacentHTML(
                "beforeend",
                BudgetTracker.entryHtml()
            );

        const row =
            this.root.querySelector(
                ".entries tr:last-child"
            );

        row.querySelector(".input-date")
            .value =
            entry.date ||
            new Date()
                .toISOString()
                .split("T")[0];

        row.querySelector(".input-description")
            .value =
            entry.description || "";

        row.querySelector(".input-category")
            .value =
            entry.category || "Food";

        row.querySelector(".input-type")
            .value =
            entry.type || "expense";

        row.querySelector(".input-amount")
            .value =
            entry.amount || "";

        row.querySelector(".delete-entry")
            .addEventListener("click", e => {

                e.target.closest("tr").remove();
                this.save();

            });

        row.querySelectorAll(".input")
            .forEach(input => {

                input.addEventListener(
                    "change",
                    () => this.save()
                );

                input.addEventListener(
                    "keyup",
                    () => this.save()
                );

            });
    }

    filterEntries(text) {

        const search =
            text.toLowerCase();

        this.getEntryRows()
            .forEach(row => {

                const description =
                    row.querySelector(
                        ".input-description"
                    ).value.toLowerCase();

                row.style.display =
                    description.includes(search)
                    ? ""
                    : "none";

            });
    }

    showEmptyState(show) {

        const state =
            document.getElementById(
                "globalEmptyState"
            );

        if (!state) return;

        state.style.display =
            show
            ? "block"
            : "none";
    }

    getEntryRows() {

        return Array.from(
            this.root.querySelectorAll(
                ".entries tr"
            )
        );
    }

    currency(value) {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR"
            }
        ).format(value || 0);
    }

    icon(category) {

        const icons = {

            Food: "🍔",
            Travel: "✈️",
            Shopping: "🛍️",
            Bills: "📄",
            Salary: "💰",
            Investment: "📈",
            Entertainment: "🎬",
            Other: "📌"

        };

        return icons[category] || "📌";
    }
}