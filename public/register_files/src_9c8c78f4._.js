(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_9c8c78f4._.js", {

"[project]/src/components/CustomAlert.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, d: __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AlertProvider": (()=>AlertProvider),
    "default": (()=>__TURBOPACK__default__export__),
    "useAlert": (()=>useAlert),
    "useAlertContext": (()=>useAlertContext)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
"use client";
;
;
// Create Alert Context
const AlertContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])();
// Custom Alert Component
const CustomAlert = ({ show, message, type = "success", duration = 3000, onClose })=>{
    _s();
    const [isVisible, setIsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(show);
    const [portalElement, setPortalElement] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CustomAlert.useEffect": ()=>{
            setIsVisible(show);
            if (show && duration) {
                const timer = setTimeout({
                    "CustomAlert.useEffect.timer": ()=>{
                        setIsVisible(false);
                        if (onClose) onClose();
                    }
                }["CustomAlert.useEffect.timer"], duration);
                return ({
                    "CustomAlert.useEffect": ()=>clearTimeout(timer)
                })["CustomAlert.useEffect"];
            }
        }
    }["CustomAlert.useEffect"], [
        show,
        duration,
        onClose
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CustomAlert.useEffect": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                let element = document.getElementById("alert-root");
                if (!element) {
                    element = document.createElement("div");
                    element.id = "alert-root";
                    document.body.appendChild(element);
                }
                setPortalElement(element);
            }
            return ({
                "CustomAlert.useEffect": ()=>{
                    if (portalElement && portalElement.parentNode) {
                        portalElement.parentNode.removeChild(portalElement);
                    }
                }
            })["CustomAlert.useEffect"];
        }
    }["CustomAlert.useEffect"], [
        portalElement
    ]);
    const handleClose = ()=>{
        setIsVisible(false);
        if (onClose) onClose();
    };
    const alertStyles = {
        success: "bg-green-100 border-green-500 text-green-700",
        error: "bg-red-100 border-red-500 text-red-700",
        warning: "bg-yellow-100 border-yellow-500 text-yellow-700",
        info: "bg-blue-100 border-blue-500 text-blue-700"
    };
    if (!portalElement || !isVisible) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 flex items-start justify-center pt-16 px-4 z-50 pointer-events-none",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `max-w-md w-full ${alertStyles[type]} border-l-4 rounded shadow-md p-4 flex items-center pointer-events-auto`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-grow",
                    children: message
                }, void 0, false, {
                    fileName: "[project]/src/components/CustomAlert.js",
                    lineNumber: 60,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: handleClose,
                    className: "ml-4 text-gray-500 hover:text-gray-700 focus:outline-none",
                    children: "✖"
                }, void 0, false, {
                    fileName: "[project]/src/components/CustomAlert.js",
                    lineNumber: 61,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/CustomAlert.js",
            lineNumber: 59,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/CustomAlert.js",
        lineNumber: 58,
        columnNumber: 9
    }, this), portalElement);
};
_s(CustomAlert, "bXusXvUWuraQJFWLivuCSWSaitc=");
_c = CustomAlert;
const useAlert = ()=>{
    _s1();
    const [alertState, setAlertState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        show: false,
        message: "",
        type: "success",
        duration: 3000
    });
    const showAlert = (message, type = "success", duration = 3000)=>{
        setAlertState({
            show: true,
            message,
            type,
            duration
        });
    };
    const hideAlert = ()=>{
        setAlertState((prev)=>({
                ...prev,
                show: false
            }));
    };
    return {
        showAlert,
        hideAlert,
        alertComponent: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CustomAlert, {
            show: alertState.show,
            message: alertState.message,
            type: alertState.type,
            duration: alertState.duration,
            onClose: hideAlert
        }, void 0, false, {
            fileName: "[project]/src/components/CustomAlert.js",
            lineNumber: 94,
            columnNumber: 13
        }, this)
    };
};
_s1(useAlert, "96FWq3u5d8dOyXQqtAvmdZrp65c=");
const AlertProvider = ({ children })=>{
    _s2();
    const alert = useAlert();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AlertContext.Provider, {
        value: alert,
        children: [
            children,
            alert.alertComponent
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/CustomAlert.js",
        lineNumber: 110,
        columnNumber: 9
    }, this);
};
_s2(AlertProvider, "/tbmWjntTVQXAO42KRyQZrplUA4=", false, function() {
    return [
        useAlert
    ];
});
_c1 = AlertProvider;
const useAlertContext = ()=>{
    _s3();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AlertContext);
};
_s3(useAlertContext, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
const __TURBOPACK__default__export__ = CustomAlert;
var _c, _c1;
__turbopack_context__.k.register(_c, "CustomAlert");
__turbopack_context__.k.register(_c1, "AlertProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/layout.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, d: __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>RootLayout)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CustomAlert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/CustomAlert.js [app-client] (ecmascript)");
"use client";
;
;
;
function RootLayout({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("html", {
        lang: "en",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("body", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$CustomAlert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertProvider"], {
                children: children
            }, void 0, false, {
                fileName: "[project]/src/app/layout.js",
                lineNumber: 10,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/layout.js",
            lineNumber: 9,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/layout.js",
        lineNumber: 8,
        columnNumber: 9
    }, this);
}
_c = RootLayout;
var _c;
__turbopack_context__.k.register(_c, "RootLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_9c8c78f4._.js.map