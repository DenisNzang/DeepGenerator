class CRUDGenerator {
    static async generate(appData) {
        const formData = new FormData();
        formData.append('action', 'generate_app');
        formData.append('app_data', JSON.stringify(appData));
        
        if (appData.appCustomization.logo) {
            formData.append('app_logo', appData.appCustomization.logo);
        }
        
        const response = await fetch('php/CRUDGenerator.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        return result;
    }
}