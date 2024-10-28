let isEditMode = false;
let editingUrl = null;

document.addEventListener("DOMContentLoaded", loadLinks);

function toggleForm() {
    const form = document.getElementById("addLinkForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
    if (form.style.display === "none") clearForm(); // إعادة التهيئة عند الإغلاق
}

function cancelEdit() {
    clearForm(); // إعادة تهيئة الحقول
    document.getElementById("addLinkForm").style.display = "none"; // إخفاء النموذج
}

function hideNoResultsMessage() {
    const searchQuery = document.getElementById("searchInput").value;
    if (!searchQuery)
        document.getElementById("noResultsMessage").style.display = "none";
}

function notify(message, icon = "success") {
    Swal.fire({
        text: message,
        icon: icon,
        timer: 2000,
        showConfirmButton: false,
        background: "#222",
        color: "#fff",
        toast: true,
        position: "top-end",
    });
}

function loadLinks() {
    const savedLinks = JSON.parse(localStorage.getItem("links")) || [];
    savedLinks.forEach((link) => displayLink(link));
}

function saveOrUpdateLink() {
    const linkName = document.getElementById("linkName").value;
    let linkUrl = document.getElementById("linkUrl").value;
    const linkDescription = document.getElementById("linkDescription").value;
    const isImportant =
        document.getElementById("linkImportance").value === "important";

    // تأكد من أن الرابط يحتوي على http أو https
    if (!linkUrl.startsWith("http://") && !linkUrl.startsWith("https://")) {
        linkUrl = "http://" + linkUrl; // أو https إذا كنت تفضل ذلك
    }

    if (!linkName || !linkUrl) {
        notify("يرجى إدخال اسم وعنوان الرابط", "error");
        return;
    }

    const link = {
        name: linkName,
        url: linkUrl,
        description: linkDescription,
        important: isImportant,
    };

    if (isEditMode) {
        showConfirmation("هل أنت متأكد من تعديل الرابط؟", () => {
            updateLink(editingUrl, link);
            notify("تم تعديل الرابط بنجاح");
            cancelEdit(); // إغلاق النموذج بعد التعديل
        });
    } else {
        saveLink(link);
        notify("تمت إضافة الرابط بنجاح");
        cancelEdit(); // إغلاق النموذج بعد الإضافة
    }
}

function updateLink(url, updatedLink) {
    const savedLinks = JSON.parse(localStorage.getItem("links")) || [];
    const index = savedLinks.findIndex((link) => link.url === url);

    if (index !== -1) {
        savedLinks[index] = updatedLink;
        localStorage.setItem("links", JSON.stringify(savedLinks));
        document.getElementById("linksList").innerHTML = "";
        savedLinks.forEach((link) => displayLink(link));
    }
}
function displayLink(link) {
    const linkItem = document.createElement("div");
    linkItem.classList.add("link-item");
    linkItem.setAttribute("data-url", link.url); // إضافة معرّف البيانات
    if (link.important) linkItem.classList.add("important");

    const openCount = link.openCount || 0;

    linkItem.innerHTML = `
        <div class="drag-handle"><i class="fas fa-grip-lines"></i></div> <!-- مقبض السحب -->
        <h3>${link.name}</h3>
        <p>${link.description}</p>
        <div class="link-icons">
            <a href="${link.url}" target="_blank" onclick="incrementOpenCount('${link.url}')">فتح الرابط</a>
            <span class="open-count"><i class="fas fa-eye"></i> ${openCount}</span>
            <button class="pin-button" onclick="toggleImportance('${link.url}')">
                <i class="fas ${link.important ? "fa-star" : "fa-star-half-alt"}"></i>
            </button>
        </div>
        <button class="delete-button" onclick="deleteLink('${link.url}')"><i class="fas fa-trash"></i></button>
        <button class="edit-button" onclick="editLink('${link.url}')"><i class="fas fa-edit"></i></button>
        <button class="share-button" onclick="shareLink('${link.url}')"><i class="fas fa-share-alt"></i></button>
    `;

    document.getElementById("linksList").appendChild(linkItem);
}


function loadLinks() {
    const savedLinks = JSON.parse(localStorage.getItem("links")) || [];
    savedLinks.forEach((link) => displayLink(link));

    // جعل القائمة قابلة للسحب باستخدام Sortable.js
    const linksList = document.getElementById("linksList");
    new Sortable(linksList, {
        animation: 150, // مدة التحريك، اختياري لجعل السحب أكثر سلاسة
        handle: ".drag-handle", // التأكد من السحب من المقبض فقط
        onEnd: function (evt) {
            updateOrderInLocalStorage();
        },
    });
}

// دالة لتحديث ترتيب الروابط في localStorage بعد السحب
function updateOrderInLocalStorage() {
    const linkItems = document.querySelectorAll("#linksList .link-item");
    const updatedLinks = Array.from(linkItems).map((item) => {
        const url = item.getAttribute("data-url");
        return JSON.parse(localStorage.getItem("links")).find((link) => link.url === url);
    });

    localStorage.setItem("links", JSON.stringify(updatedLinks));
}




function incrementOpenCount(url) {
    const savedLinks = JSON.parse(localStorage.getItem("links")) || [];
    const linkToUpdate = savedLinks.find((link) => link.url === url);

    if (linkToUpdate) {
        linkToUpdate.openCount = (linkToUpdate.openCount || 0) + 1; // زيادة عدد الفتحات
        localStorage.setItem("links", JSON.stringify(savedLinks)); // تحديث البيانات في localStorage

        // تحديث العرض ليظهر عدد الفتحات الجديد
        document.getElementById("linksList").innerHTML = "";
        savedLinks.forEach((link) => displayLink(link));
    }
}

const link = {
    name: linkName,
    url: linkUrl,
    description: linkDescription,
    important: isImportant,
    openCount: 0, // بدء عدد الفتحات من 0
};

function shareLink(url) {
    if (navigator.share) {
        navigator
            .share({
                title: "Check out this link!",
                url: url,
            })
            .then(() => {
                notify("تمت مشاركة الرابط بنجاح");
            })
            .catch((error) => {
                notify("فشل في مشاركة الرابط", "error");
            });
    } else {
        // Fallback for browsers that do not support the Web Share API
        const tempInput = document.createElement("input");
        document.body.appendChild(tempInput);
        tempInput.value = url;
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        notify("تم نسخ الرابط إلى الحافظة");
    }
}

function saveLink(link) {
    const savedLinks = JSON.parse(localStorage.getItem("links")) || [];
    savedLinks.push(link);
    localStorage.setItem("links", JSON.stringify(savedLinks));
    displayLink(link);
}

function deleteLink(url) {
    showConfirmation("هل أنت متأكد من حذف هذا الرابط؟", () => {
        const savedLinks = JSON.parse(localStorage.getItem("links")) || [];
        const updatedLinks = savedLinks.filter((link) => link.url !== url);
        localStorage.setItem("links", JSON.stringify(updatedLinks));
        document.getElementById("linksList").innerHTML = "";
        updatedLinks.forEach((link) => displayLink(link));
        notify("تم حذف الرابط بنجاح");
    });
}

function editLink(url) {
    const savedLinks = JSON.parse(localStorage.getItem("links")) || [];
    const linkToEdit = savedLinks.find((link) => link.url === url);

    if (linkToEdit) {
        document.getElementById("linkName").value = linkToEdit.name;
        document.getElementById("linkUrl").value = linkToEdit.url;
        document.getElementById("linkDescription").value = linkToEdit.description;
        document.getElementById("linkImportance").value = linkToEdit.important
            ? "important"
            : "normal";
        editingUrl = linkToEdit.url;
        isEditMode = true;
        toggleForm();
    }
}

function clearForm() {
    document.getElementById("linkName").value = "";
    document.getElementById("linkUrl").value = "";
    document.getElementById("linkDescription").value = "";
    document.getElementById("linkImportance").value = "normal";
    editingUrl = null;
    isEditMode = false;
}

function toggleImportance(url) {
    const savedLinks = JSON.parse(localStorage.getItem("links")) || [];
    const linkToToggle = savedLinks.find((link) => link.url === url);

    if (linkToToggle) {
        linkToToggle.important = !linkToToggle.important;
        localStorage.setItem("links", JSON.stringify(savedLinks));
        document.getElementById("linksList").innerHTML = "";
        savedLinks.forEach((link) => displayLink(link));
        notify(
            linkToToggle.important ? "تم تمييز الرابط كمهم" : "تم إزالة تمييز الرابط"
        );
    }
}

function filterLinks() {
    const searchInput = document
        .getElementById("searchInput")
        .value.toLowerCase();
    const linkItems = document.querySelectorAll(".link-item");
    let hasResults = false;

    linkItems.forEach((item) => {
        const linkName = item.querySelector("h3").textContent.toLowerCase();
        if (linkName.includes(searchInput)) {
            item.style.display = "block";
            hasResults = true;
        } else {
            item.style.display = "none";
        }
    });

    document.getElementById("noResultsMessage").style.display = hasResults
        ? "none"
        : "block";
}

function filterByImportance() {
    const importanceFilter = document.getElementById("filterImportance").value;
    const linkItems = document.querySelectorAll(".link-item");

    linkItems.forEach((item) => {
        if (importanceFilter === "all") {
            item.style.display = "block";
        } else {
            const isImportant = item.classList.contains("important");
            item.style.display =
                (importanceFilter === "important" && isImportant) ||
                    (importanceFilter === "normal" && !isImportant)
                    ? "block"
                    : "none";
        }
    });
}

function showConfirmation(message, callback) {
    Swal.fire({
        text: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم",
        cancelButtonText: "إلغاء",
        background: "#222",
        color: "#fff",
    }).then((result) => {
        if (result.isConfirmed) callback();
    });
}

function toggleForm() {
    const form = document.getElementById("addLinkForm");
    const overlay = document.getElementById("modalOverlay");

    // تحقق مما إذا كانت الخلفية والنموذج مرئيين، ثم اقلب حالتهما
    if (form.style.display === "block") {
        form.style.display = "none";
        overlay.style.display = "none";
        clearForm(); // إعادة تعيين الحقول عند الإغلاق
    } else {
        form.style.display = "block";
        overlay.style.display = "block";
    }
}

// تأكد من إغلاق النموذج والخلفية عند النقر على `modalOverlay`
document.getElementById("modalOverlay").addEventListener("click", () => {
    const form = document.getElementById("addLinkForm");
    const overlay = document.getElementById("modalOverlay");
    form.style.display = "none";
    overlay.style.display = "none";
    clearForm(); // إعادة تعيين الحقول عند الإغلاق
});

function cancelEdit() {
    clearForm(); // إعادة تهيئة الحقول
    document.getElementById("addLinkForm").style.display = "none"; // إخفاء النموذج
    document.getElementById("modalOverlay").style.display = "none"; // إخفاء الخلفية
}

// تأكد من إغلاق النموذج والخلفية عند النقر على `modalOverlay`
document.getElementById("modalOverlay").addEventListener("click", () => {
    cancelEdit(); // استخدم دالة cancelEdit لإغلاق النموذج والخلفية
});

// إذا كان لديك زر لإغلاق النموذج، ربطه بنفس الدالة
document.getElementById("closeButton").addEventListener("click", cancelEdit);

new Sortable(linksList, {
    animation: 150,
    handle: ".drag-handle",
    touchStartThreshold: 10, // تحديد العتبة لبدء السحب
    onEnd: function (evt) {
        updateOrderInLocalStorage();
    },
});
