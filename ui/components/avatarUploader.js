/**
 * INTDWN - Avatar Uploader Component
 */

import { storage } from '../../core/storage.js';

export function createAvatarUploader(currentAvatar = null) {
    return `
        <div class="avatar-uploader">
            <div class="avatar-preview" id="avatar-preview">
                ${currentAvatar 
                    ? `<img src="${currentAvatar}" alt="Avatar">`
                    : `<div class="avatar-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                       </div>`
                }
            </div>
            <input type="file" id="avatar-input" accept="image/*" class="visually-hidden">
            <label for="avatar-input" class="btn btn-secondary btn-sm">
                ${currentAvatar ? 'Change' : 'Upload'}
            </label>
        </div>
    `;
}

export function initAvatarUploader(onChange) {
    const input = document.getElementById('avatar-input');
    const preview = document.getElementById('avatar-preview');

    if (!input || !preview) return;

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size should be less than 2MB');
            return;
        }

        // Read and preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            preview.innerHTML = `<img src="${dataUrl}" alt="Avatar">`;
            
            if (onChange) {
                onChange(dataUrl);
            }
        };
        reader.readAsDataURL(file);
    });
}

export async function saveAvatar(dataUrl) {
    await storage.saveUser({ avatar: dataUrl });
}

export async function getAvatar() {
    const user = await storage.getUser();
    return user?.avatar || null;
}
