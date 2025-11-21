class CRUDGeneratorApp {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 7;
        this.databaseType = null;
        this.connectionData = {};
        this.databaseStructure = {};
        this.selectedTables = [];
        this.customQueries = [];
        this.fieldConfigurations = {};
        this.appCustomization = {};
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateNavigation();
    }
    
    bindEvents() {
        // Navegación entre pasos
        document.getElementById('nextStep').addEventListener('click', () => this.nextStep());
        document.getElementById('prevStep').addEventListener('click', () => this.prevStep());
        
        // Selección de tipo de base de datos
        document.querySelectorAll('input[name="databaseType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleDatabaseTypeChange(e.target.value));
        });
        
        // Prueba de conexión
        document.getElementById('testConnection').addEventListener('click', () => this.testConnection());
        
        // Agregar consultas personalizadas
        document.getElementById('addQuery').addEventListener('click', () => this.addCustomQuery());
        
        // Generar aplicación
        document.getElementById('generateApp').addEventListener('click', () => this.generateApplication());
        
        // Vista previa del logo
        document.getElementById('appLogo').addEventListener('change', (e) => this.previewLogo(e.target.files[0]));
    }
    
    handleDatabaseTypeChange(type) {
        this.databaseType = type;
        
        // Mostrar configuración apropiada
        document.querySelectorAll('.database-config').forEach(el => el.classList.add('d-none'));
        
        if (type === 'sqlite') {
            document.getElementById('sqlite-config').classList.remove('d-none');
        } else {
            document.getElementById('server-config').classList.remove('d-none');
        }
    }
    
    async testConnection() {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.innerHTML = '<div class="alert alert-info">Probando conexión...</div>';
        
        try {
            const connectionData = this.getConnectionData();
            const result = await DatabaseManager.testConnection(this.databaseType, connectionData);
            
            if (result.success) {
                statusElement.innerHTML = '<div class="alert alert-success">✓ Conexión exitosa</div>';
            } else {
                statusElement.innerHTML = `<div class="alert alert-danger">✗ Error: ${result.error}</div>`;
            }
        } catch (error) {
            statusElement.innerHTML = `<div class="alert alert-danger">✗ Error: ${error.message}</div>`;
        }
    }
    
    getConnectionData() {
        if (this.databaseType === 'sqlite') {
            const fileInput = document.getElementById('sqliteFile');
            return {
                file: fileInput.files[0]
            };
        } else {
            return {
                host: document.getElementById('host').value,
                port: document.getElementById('port').value,
                database: document.getElementById('database').value,
                schema: document.getElementById('schema').value || 'public',
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            };
        }
    }
    
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.showStep(this.currentStep);
                this.updateNavigation();
                
                // Ejecutar acciones específicas del paso
                this.handleStepActions(this.currentStep);
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateNavigation();
        }
    }
    
    showStep(step) {
        // Ocultar todos los pasos
        document.querySelectorAll('.step-content').forEach(el => {
            el.classList.add('d-none');
        });
        
        // Mostrar paso actual
        document.getElementById(`step-${step}`).classList.remove('d-none');
        
        // Actualizar stepper
        this.updateStepper(step);
    }
    
    updateStepper(step) {
        document.querySelectorAll('.stepper-item').forEach((item, index) => {
            const stepNumber = index + 1;
            
            item.classList.remove('active', 'completed');
            
            if (stepNumber < step) {
                item.classList.add('completed');
            } else if (stepNumber === step) {
                item.classList.add('active');
            }
        });
    }
    
    updateNavigation() {
        const prevButton = document.getElementById('prevStep');
        const nextButton = document.getElementById('nextStep');
        
        // Actualizar texto del botón siguiente en el último paso
        if (this.currentStep === this.totalSteps) {
            nextButton.classList.add('d-none');
        } else {
            nextButton.classList.remove('d-none');
            nextButton.innerHTML = `Siguiente <i class="bi bi-arrow-right"></i>`;
        }
        
        // Ocultar botón anterior en el primer paso
        if (this.currentStep === 1) {
            prevButton.classList.add('d-none');
        } else {
            prevButton.classList.remove('d-none');
        }
    }
    
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateStep1();
            case 2:
                return this.validateStep2();
            case 3:
                return this.validateStep3();
            default:
                return true;
        }
    }
    
    validateStep1() {
        if (!this.databaseType) {
            alert('Por favor, selecciona un tipo de base de datos');
            return false;
        }
        return true;
    }
    
    validateStep2() {
        const connectionData = this.getConnectionData();
        
        if (this.databaseType === 'sqlite') {
            if (!connectionData.file) {
                alert('Por favor, selecciona un archivo de base de datos SQLite');
                return false;
            }
        } else {
            const required = ['host', 'port', 'database', 'username'];
            for (const field of required) {
                if (!connectionData[field]) {
                    alert(`Por favor, completa el campo: ${field}`);
                    return false;
                }
            }
        }
        
        return true;
    }
    
    validateStep3() {
        if (this.selectedTables.length === 0) {
            alert('Debes seleccionar al menos una tabla para continuar');
            return false;
        }
        return true;
    }
    
    async handleStepActions(step) {
        switch (step) {
            case 3:
                await this.analyzeDatabase();
                break;
            case 5:
                this.showFieldsConfiguration();
                break;
        }
    }
    
    async analyzeDatabase() {
        try {
            const connectionData = this.getConnectionData();
            
            // Mostrar estado de análisis
            document.getElementById('analysisLoading').classList.remove('d-none');
            
            this.databaseStructure = await DatabaseManager.analyzeDatabase(this.databaseType, connectionData);
            
            // Ocultar spinner y mostrar resultados
            document.getElementById('analysisLoading').classList.add('d-none');
            document.getElementById('analysisResults').classList.remove('d-none');
            
            // Actualizar lista de tablas (ahora con checkboxes)
            this.updateTablesList();
            
        } catch (error) {
            // Ocultar elementos de carga
            document.getElementById('analysisLoading').classList.add('d-none');
            
            alert(`Error al analizar la base de datos: ${error.message}`);
            this.prevStep(); // Volver al paso anterior en caso de error
        }
    }
    
    updateTablesList() {
        const tablesList = document.getElementById('analysisResults');
        tablesList.innerHTML = '';
        
        if (!this.databaseStructure.tables) {
            tablesList.innerHTML = '<div class="alert alert-warning">No se encontraron tablas en la base de datos</div>';
            return;
        }
        
        // Crear dashboard compacto
        const totalTables = Object.keys(this.databaseStructure.tables).length;
        const totalColumns = Object.values(this.databaseStructure.tables).reduce((sum, table) => {
            return sum + (table.columns ? table.columns.length : 0);
        }, 0);
        const totalRelationships = this.databaseStructure.relationships ? this.databaseStructure.relationships.length : 0;
        
        const dashboard = document.createElement('div');
        dashboard.className = 'dashboard-compact mb-4';
        dashboard.innerHTML = `
            <div class="row text-center">
                <div class="col-3">
                    <div class="stat-number">${totalTables}</div>
                    <div class="stat-label">TABLAS</div>
                </div>
                <div class="col-3">
                    <div class="stat-number">${totalColumns}</div>
                    <div class="stat-label">COLUMNAS</div>
                </div>
                <div class="col-3">
                    <div class="stat-number">${totalRelationships}</div>
                    <div class="stat-label">RELACIONES</div>
                </div>
                <div class="col-3">
                    <div class="stat-number">${this.databaseType.toUpperCase()}</div>
                    <div class="stat-label">TIPO BD</div>
                </div>
            </div>
        `;
        
        tablesList.appendChild(dashboard);

        // Agregar instrucciones
        const instructions = document.createElement('div');
        instructions.className = 'alert alert-warning mb-4';
        instructions.innerHTML = `
            <i class="bi bi-check-square"></i>
            <strong>Selecciona las tablas</strong> que deseas incluir en tu aplicación CRUD marcando las casillas correspondientes.
        `;
        tablesList.appendChild(instructions);
        
        // Crear accordion para las tablas con checkboxes
        const accordionId = 'analysisAccordion';
        const accordion = document.createElement('div');
        accordion.className = 'accordion';
        accordion.id = accordionId;
        
        let accordionIndex = 0;
        
        Object.keys(this.databaseStructure.tables).forEach(tableName => {
            const table = this.databaseStructure.tables[tableName];
            const isChecked = this.selectedTables.includes(tableName);
            const itemId = `analysis-${accordionIndex}`;
            const collapseId = `analysis-collapse-${accordionIndex}`;
            
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';
            accordionItem.innerHTML = `
                <h2 class="accordion-header">
                    <button class="accordion-button ${accordionIndex === 0 ? '' : 'collapsed'}" 
                            type="button" data-bs-toggle="collapse" 
                            data-bs-target="#${collapseId}" 
                            aria-expanded="${accordionIndex === 0 ? 'true' : 'false'}" 
                            aria-controls="${collapseId}">
                        <div class="form-check me-3 mb-0">
                            <input class="form-check-input table-checkbox" 
                                   type="checkbox" 
                                   value="${tableName}" 
                                   id="table-${tableName}" 
                                   ${isChecked ? 'checked' : ''}>
                        </div>
                        <div class="d-flex justify-content-between align-items-center w-100 me-3">
                            <div>
                                <span class="fw-bold text-primary">${tableName}</span>
                                <span class="badge bg-secondary ms-2">${table.columns ? table.columns.length : 0} campos</span>
                            </div>
                            <div>
                                ${table.primaryKey ? `<span class="badge bg-success me-2">PK: ${table.primaryKey}</span>` : ''}
                                ${table.foreignKeys && table.foreignKeys.length > 0 ? `<span class="badge bg-info me-2">${table.foreignKeys.length} FK</span>` : ''}
                                <i class="bi bi-chevron-down text-muted"></i>
                            </div>
                        </div>
                    </button>
                </h2>
                <div id="${collapseId}" 
                     class="accordion-collapse collapse ${accordionIndex === 0 ? 'show' : ''}" 
                     data-bs-parent="#${accordionId}">
                    <div class="accordion-body p-3">
                        ${this.generateAnalysisTableFields(tableName, table)}
                    </div>
                </div>
            `;
            
            accordion.appendChild(accordionItem);
            accordionIndex++;
        });
        
        tablesList.appendChild(accordion);

        // Vincular eventos de los checkboxes
        this.bindTableCheckboxEvents();
    }

    bindTableCheckboxEvents() {
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('table-checkbox')) {
                this.handleTableSelection(e.target.value, e.target.checked);
            }
        });
    }

    handleTableSelection(tableName, selected) {
        if (selected) {
            if (!this.selectedTables.includes(tableName)) {
                this.selectedTables.push(tableName);
            }
        } else {
            this.selectedTables = this.selectedTables.filter(name => name !== tableName);
        }
        
        console.log('Tablas seleccionadas:', this.selectedTables);
    }

    generateAnalysisTableFields(tableName, table) {
        if (!table.columns || table.columns.length === 0) {
            return '<div class="text-muted">No se encontraron columnas en esta tabla</div>';
        }
        
        let html = `
            <div class="row">
                <div class="col-12">
                    <h6 class="text-primary mb-3">Estructura detallada de <code>${tableName}</code></h6>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-bordered table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Campo</th>
                            <th>Tipo</th>
                            <th>Nulo</th>
                            <th>Valor por defecto</th>
                            <th>Clave</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        table.columns.forEach(column => {
            const isPrimaryKey = column.primaryKey || false;
            const isForeignKey = column.foreignKey || false;
            
            let keyBadge = '';
            if (isPrimaryKey) {
                keyBadge = '<span class="badge bg-danger">PRIMARY</span>';
            } else if (isForeignKey) {
                keyBadge = '<span class="badge bg-info">FOREIGN</span>';
            }
            
            html += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <strong>${column.name}</strong>
                            ${isPrimaryKey ? '<i class="bi bi-key text-danger ms-2" title="Clave primaria"></i>' : ''}
                            ${isForeignKey ? '<i class="bi bi-link-45deg text-info ms-2" title="Clave foránea"></i>' : ''}
                        </div>
                    </td>
                    <td><code class="small">${column.type}</code></td>
                    <td class="text-center">${column.nullable ? '<span class="badge bg-success">SÍ</span>' : '<span class="badge bg-warning">NO</span>'}</td>
                    <td class="text-center">${column.default ? `<code class="small">${column.default}</code>` : '<span class="text-muted">-</span>'}</td>
                    <td class="text-center">${keyBadge || '<span class="text-muted">-</span>'}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Información adicional de la tabla
        if (table.foreignKeys && table.foreignKeys.length > 0) {
            html += `
                <div class="row mt-4">
                    <div class="col-12">
                        <h6 class="text-info mb-2"><i class="bi bi-diagram-3 me-2"></i>Relaciones foráneas</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered">
                                <thead class="table-info">
                                    <tr>
                                        <th>Columna local</th>
                                        <th>Tabla referenciada</th>
                                        <th>Columna referenciada</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            table.foreignKeys.forEach(fk => {
                html += `
                    <tr>
                        <td><code class="text-primary">${fk.column}</code></td>
                        <td><code class="text-success">${fk.referenced_table}</code></td>
                        <td><code class="text-info">${fk.referenced_column}</code></td>
                    </tr>
                `;
            });
            
            html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Resumen de la tabla
        const totalColumns = table.columns ? table.columns.length : 0;
        const primaryKeys = table.columns ? table.columns.filter(col => col.primaryKey).length : 0;
        const foreignKeys = table.foreignKeys ? table.foreignKeys.length : 0;
        const notNullColumns = table.columns ? table.columns.filter(col => !col.nullable).length : 0;
        
        html += `
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card border-0 bg-light">
                        <div class="card-header bg-transparent border-0">
                            <h6 class="mb-0 text-dark"><i class="bi bi-graph-up me-2"></i>Resumen de la tabla</h6>
                        </div>
                        <div class="card-body py-2">
                            <div class="row text-center">
                                <div class="col-3">
                                    <div class="fw-bold text-primary fs-5">${totalColumns}</div>
                                    <small class="text-muted">Campos totales</small>
                                </div>
                                <div class="col-3">
                                    <div class="fw-bold text-success fs-5">${primaryKeys}</div>
                                    <small class="text-muted">Claves primarias</small>
                                </div>
                                <div class="col-3">
                                    <div class="fw-bold text-info fs-5">${foreignKeys}</div>
                                    <small class="text-muted">Relaciones</small>
                                </div>
                                <div class="col-3">
                                    <div class="fw-bold text-warning fs-5">${notNullColumns}</div>
                                    <small class="text-muted">NOT NULL</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }
    
    addCustomQuery() {
        const container = document.getElementById('customQueriesContainer');
        const queryId = 'query_' + Date.now();
        
        const queryItem = document.createElement('div');
        queryItem.className = 'query-item card mb-3';
        queryItem.setAttribute('data-query-id', queryId);
        queryItem.innerHTML = `
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <label class="form-label">Nombre de la consulta</label>
                        <input type="text" class="form-control query-name" placeholder="Ej: Ventas por mes">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Tipo</label>
                        <select class="form-select query-type">
                            <option value="readonly">Solo lectura</option>
                            <option value="editable">Editable</option>
                        </select>
                    </div>
                </div>
                <div class="mt-3">
                    <label class="form-label">Consulta SQL</label>
                    <textarea class="form-control query-sql" rows="3" placeholder="SELECT * FROM tabla WHERE condición"></textarea>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger mt-2 remove-query">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        container.appendChild(queryItem);
        
        // Vincular evento de eliminación
        queryItem.querySelector('.remove-query').addEventListener('click', () => {
            queryItem.remove();
            this.customQueries = this.customQueries.filter(q => q.id !== queryId);
        });
        
        // Vincular eventos de entrada para guardar datos
        const inputs = queryItem.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.saveCustomQueryData(queryId));
            input.addEventListener('input', () => this.saveCustomQueryData(queryId));
        });
    }
    
    saveCustomQueryData(queryId) {
        const queryElement = document.querySelector(`[data-query-id="${queryId}"]`);
        
        if (queryElement) {
            const name = queryElement.querySelector('.query-name').value;
            const type = queryElement.querySelector('.query-type').value;
            const sql = queryElement.querySelector('.query-sql').value;
            
            const existingIndex = this.customQueries.findIndex(q => q.id === queryId);
            
            if (name && sql) {
                if (existingIndex >= 0) {
                    this.customQueries[existingIndex] = { id: queryId, name, type, sql };
                } else {
                    this.customQueries.push({ id: queryId, name, type, sql });
                }
            }
        }
        
        console.log('Consultas personalizadas:', this.customQueries);
    }
    
    showFieldsConfiguration() {
        const container = document.getElementById('fieldsConfiguration');
        container.innerHTML = '';
        
        if (this.selectedTables.length === 0 && this.customQueries.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle"></i> 
                    No hay tablas ni consultas seleccionadas para configurar.
                </div>
            `;
            return;
        }
        
        // Crear pestañas
        const navTabs = document.createElement('ul');
        navTabs.className = 'nav nav-tabs mb-3';
        navTabs.id = 'fieldsConfigTabs';
        
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.id = 'fieldsConfigContent';
        
        // Pestañas para tablas seleccionadas
        this.selectedTables.forEach((tableName, index) => {
            const isActive = index === 0;
            
            // Pestaña
            const navItem = document.createElement('li');
            navItem.className = 'nav-item';
            navItem.innerHTML = `
                <button class="nav-link ${isActive ? 'active' : ''}" data-bs-toggle="tab" 
                        data-bs-target="#tab-${this.sanitizeId(tableName)}" type="button">
                    ${tableName}
                </button>
            `;
            navTabs.appendChild(navItem);
            
            // Contenido de la pestaña
            const tabPane = document.createElement('div');
            tabPane.className = `tab-pane fade ${isActive ? 'show active' : ''}`;
            tabPane.id = `tab-${this.sanitizeId(tableName)}`;
            
            const tableConfig = this.databaseStructure.tables[tableName];
            if (tableConfig) {
                tabPane.innerHTML = this.generateFieldsConfiguration(tableName, tableConfig);
            } else {
                tabPane.innerHTML = `<div class="alert alert-warning">No se encontró información para la tabla ${tableName}</div>`;
            }
            
            tabContent.appendChild(tabPane);
        });
        
        // Pestañas para consultas personalizadas
        this.customQueries.forEach((query, index) => {
            const offset = this.selectedTables.length;
            const isActive = offset === 0 && index === 0;
            const queryId = this.sanitizeId('query-' + query.id);
            
            const navItem = document.createElement('li');
            navItem.className = 'nav-item';
            navItem.innerHTML = `
                <button class="nav-link ${isActive ? 'active' : ''}" data-bs-toggle="tab" 
                        data-bs-target="#tab-${queryId}" type="button">
                    ${query.name || 'Consulta ' + (index + 1)}
                </button>
            `;
            navTabs.appendChild(navItem);
            
            const tabPane = document.createElement('div');
            tabPane.className = `tab-pane fade ${isActive ? 'show active' : ''}`;
            tabPane.id = `tab-${queryId}`;
            tabPane.innerHTML = this.generateQueryFieldsConfiguration(query);
            
            tabContent.appendChild(tabPane);
        });
        
        container.appendChild(navTabs);
        container.appendChild(tabContent);
    }
    
    sanitizeId(id) {
        return id.replace(/[^a-zA-Z0-9-_]/g, '_');
    }
    
    generateFieldsConfiguration(tableName, tableConfig) {
        let html = `
            <h5>Configuración de campos para: <code>${tableName}</code></h5>
            <div class="alert alert-info small">
                <i class="bi bi-info-circle"></i> Configura cómo se mostrarán los campos en listados y formularios.
            </div>
        `;
        
        if (!tableConfig.columns || tableConfig.columns.length === 0) {
            html += '<div class="alert alert-warning">No se encontraron columnas en esta tabla</div>';
            return html;
        }
        
        tableConfig.columns.forEach(column => {
            html += this.generateFieldConfigCard(tableName, column);
        });
        
        return html;
    }
    
    generateQueryFieldsConfiguration(query) {
        return `
            <h5>Configuración para consulta: <code>${query.name || 'Consulta personalizada'}</code></h5>
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> 
                Para consultas personalizadas, la configuración de campos se determinará automáticamente 
                basándose en los resultados de la consulta cuando se ejecute la aplicación.
            </div>
            <div class="card">
                <div class="card-body">
                    <h6>Consulta SQL:</h6>
                    <pre class="bg-light p-3 border rounded"><code>${query.sql}</code></pre>
                    <p class="text-muted small">
                        Tipo: ${query.type === 'editable' ? 'Editable' : 'Solo lectura'}
                    </p>
                </div>
            </div>
        `;
    }
    
    generateFieldConfigCard(tableName, column) {
        const fieldId = `${tableName}_${column.name}`;
        const isPrimaryKey = column.primaryKey || false;
        const isForeignKey = column.foreignKey || false;
        
        return `
            <div class="field-config-compact card mb-2">
                <div class="card-body p-2">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <h6 class="card-title mb-1 small fw-bold">${column.name}</h6>
                            <p class="small text-muted mb-1">
                                <code class="small">${column.type}</code>
                                ${isPrimaryKey ? '<span class="badge bg-danger badge-sm ms-1">PK</span>' : ''}
                                ${isForeignKey ? `<span class="badge bg-info badge-sm ms-1">FK</span>` : ''}
                            </p>
                        </div>
                        <div class="col-md-9">
                            <div class="row g-1">
                                <div class="col-md-4">
                                    <label class="form-label small fw-bold">Etiqueta</label>
                                    <input type="text" class="form-control form-control-sm" 
                                           value="${this.formatFieldName(column.name)}"
                                           data-table="${tableName}" data-field="${column.name}">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small fw-bold">Control</label>
                                    <select class="form-select form-select-sm"
                                            data-table="${tableName}" data-field="${column.name}">
                                        ${this.generateControlOptions(column)}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <div class="d-flex gap-3 mt-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" 
                                                   data-table="${tableName}" data-field="${column.name}"
                                                   data-type="show-in-list" checked>
                                            <label class="form-check-label small">
                                                Listado
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" 
                                                   data-table="${tableName}" data-field="${column.name}"
                                                   data-type="required" ${!column.nullable ? 'checked' : ''}>
                                            <label class="form-check-label small">
                                                Requerido
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ${this.isNumericType(column.type) ? this.generateNumericFormatConfig(tableName, column) : ''}
                            ${this.isDateType(column.type) ? this.generateDateFormatConfig(tableName, column) : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateControlOptions(column) {
        const options = {
            text: 'Campo de texto',
            textarea: 'Área de texto',
            number: 'Campo numérico',
            email: 'Campo de email',
            date: 'Selector de fecha',
            datetime: 'Selector de fecha y hora',
            select: 'Lista desplegable',
            checkbox: 'Casilla de verificación',
            radio: 'Botones de opción',
            hidden: 'Campo oculto'
        };
        
        let defaultType = this.getDefaultControlType(column.type, column.primaryKey);
        
        let html = '';
        for (const [value, label] of Object.entries(options)) {
            const selected = defaultType === value ? 'selected' : '';
            html += `<option value="${value}" ${selected}>${label}</option>`;
        }
        
        return html;
    }
    
    getDefaultControlType(columnType, isPrimaryKey = false) {
        if (isPrimaryKey) return 'hidden';
        if (this.isDateType(columnType)) return 'date';
        if (this.isNumericType(columnType)) return 'number';
        if (columnType.includes('text') || columnType.includes('char')) {
            return columnType.includes('text') ? 'textarea' : 'text';
        }
        return 'text';
    }
    
    isNumericType(type) {
        const numericTypes = ['int', 'integer', 'decimal', 'float', 'double', 'number', 'numeric', 'real'];
        return numericTypes.some(numericType => type.includes(numericType));
    }
    
    isDateType(type) {
        const dateTypes = ['date', 'time', 'datetime', 'timestamp'];
        return dateTypes.some(dateType => type.includes(dateType));
    }
    
    generateNumericFormatConfig(tableName, column) {
        return `
            <div class="row mt-1 g-1">
                <div class="col-md-6">
                    <label class="form-label small">Formato</label>
                    <select class="form-select form-select-sm"
                            data-table="${tableName}" data-field="${column.name}">
                        <option value="integer">Entero</option>
                        <option value="decimal">Decimal</option>
                        <option value="currency">Moneda</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label small">Decimales</label>
                    <input type="number" class="form-control form-control-sm"
                           value="2" min="0" max="6"
                           data-table="${tableName}" data-field="${column.name}">
                </div>
            </div>
        `;
    }
    
    generateDateFormatConfig(tableName, column) {
        return `
            <div class="row mt-1">
                <div class="col-md-12">
                    <label class="form-label small">Formato fecha</label>
                    <select class="form-select form-select-sm"
                            data-table="${tableName}" data-field="${column.name}">
                        <option value="short">Corta</option>
                        <option value="medium">Media</option>
                        <option value="long">Larga</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    formatFieldName(name) {
        return name
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
    
    previewLogo(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('logoPreview').innerHTML = `
                    <img src="${e.target.result}" class="img-fluid" style="max-height: 100px;">
                    <p class="small text-muted mt-2">${file.name}</p>
                `;
            };
            reader.readAsDataURL(file);
        }
    }
    
    async generateApplication() {
        const progressElement = document.getElementById('generationProgress');
        const progressBar = progressElement.querySelector('.progress-bar');
        const progressText = document.getElementById('progressText');
        const resultElement = document.getElementById('generationResult');
        
        // Mostrar progreso
        progressElement.classList.remove('d-none');
        
        try {
            // Recopilar todos los datos
            const appData = {
                databaseType: this.databaseType,
                connectionData: this.getConnectionData(),
                selectedTables: this.selectedTables,
                customQueries: this.customQueries,
                fieldConfigurations: this.fieldConfigurations,
                appCustomization: {
                    title: document.getElementById('appTitle').value || 'Mi App CRUD',
                    primaryColor: document.getElementById('primaryColor').value,
                    logo: document.getElementById('appLogo').files[0] || null
                }
            };
            
            const formData = new FormData();
            formData.append('action', 'generate_app');
            formData.append('app_data', JSON.stringify(appData));
            
            // Agregar archivo de logo si existe
            const logoFile = document.getElementById('appLogo').files[0];
            if (logoFile) {
                formData.append('app_logo', logoFile);
            }
            
            // Simular progreso
            for (let i = 0; i <= 100; i += 10) {
                progressBar.style.width = `${i}%`;
                progressText.textContent = this.getProgressMessage(i);
                await this.delay(300);
            }
            
            // Generar aplicación
            const response = await fetch('php/CRUDGenerator.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            // Mostrar resultado
            progressElement.classList.add('d-none');
            resultElement.classList.remove('d-none');
            resultElement.innerHTML = `
                <div class="alert alert-success">
                    <h4><i class="bi bi-check-circle"></i> ¡Aplicación generada exitosamente!</h4>
                    <p>Tu aplicación CRUD ha sido generada y está lista para usar.</p>
                    <div class="mt-3">
                        <a href="${result.downloadUrl}" class="btn btn-success me-2" download>
                            <i class="bi bi-download"></i> Descargar Aplicación
                        </a>
                        <button class="btn btn-outline-primary" onclick="location.reload()">
                            <i class="bi bi-plus-circle"></i> Crear Otra Aplicación
                        </button>
                    </div>
                </div>
            `;
            
        } catch (error) {
            progressElement.classList.add('d-none');
            resultElement.classList.remove('d-none');
            resultElement.innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="bi bi-exclamation-triangle"></i> Error en la generación</h4>
                    <p>Ha ocurrido un error al generar la aplicación: ${error.message}</p>
                    <button class="btn btn-outline-secondary mt-2" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
    
    getProgressMessage(progress) {
        const messages = {
            0: 'Preparando...',
            10: 'Configurando estructura...',
            30: 'Generando archivos PHP...',
            50: 'Creando interfaces...',
            70: 'Configurando base de datos...',
            90: 'Finalizando...',
            100: 'Completado!'
        };
        
        return messages[progress] || `Progreso: ${progress}%`;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CRUDGeneratorApp();
});