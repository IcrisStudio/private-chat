"use client";

import { useEffect } from "react";

interface AdScriptProps {
    script: string;
    id?: string;
}

export function AdScript({ script, id }: AdScriptProps) {
    useEffect(() => {
        const container = document.getElementById(id || "ad-container");
        if (container) {
            container.innerHTML = script;

            // Execute scripts
            const scripts = container.getElementsByTagName("script");
            for (let i = 0; i < scripts.length; i++) {
                const script = scripts[i];
                const newScript = document.createElement("script");

                if (script.src) {
                    newScript.src = script.src;
                    newScript.async = true;
                }

                if (script.innerHTML) {
                    newScript.innerHTML = script.innerHTML;
                }

                // Copy attributes
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });

                script.parentNode?.replaceChild(newScript, script);
            }
        }
    }, [script, id]);

    return <div id={id || "ad-container"} />;
}
