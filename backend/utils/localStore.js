const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

const INITIAL_PROJECTS = [
    {
        _id: 'proj_001',
        projectId: 'RC-001',
        projectName: 'Erode – Perundurai Village Road',
        village: 'Perundurai',
        district: 'Erode',
        state: 'Tamil Nadu',
        roadLength: 8.5,
        allocatedBudget: 42500000,
        amountSpent: 2762500,
        startDate: '2025-06-01',
        expectedCompletion: '2026-12-31',
        currentProgress: 65,
        status: 'In Progress',
        contractor: 'KPR Infrastructure Pvt Ltd',
        description: 'Bituminous surface paving linking agricultural farms to Perundurai market yard.',
        publicDescription: 'Upgrading 8.5 km single-lane dirt road to 2-lane asphalt road with cross-drainage culverts.',
        isPublic: true,
        showContractor: true,
        showFinancialData: true,
        createdAt: '2025-06-01T00:00:00.000Z'
    },
    {
        _id: 'proj_002',
        projectId: 'RC-002',
        projectName: 'Salem – Omalur Rural Link Corridor',
        village: 'Omalur',
        district: 'Salem',
        state: 'Tamil Nadu',
        roadLength: 12.0,
        allocatedBudget: 68000000,
        amountSpent: 2856000,
        startDate: '2025-08-15',
        expectedCompletion: '2026-10-15',
        currentProgress: 42,
        status: 'In Progress',
        contractor: 'Salem Earthmovers & Builders',
        description: 'Widening of rural corridor connecting textile units to state highway.',
        publicDescription: 'Construction of Sub-base macadam and embankment retaining wall along Salem sector.',
        isPublic: true,
        showContractor: true,
        showFinancialData: true,
        createdAt: '2025-08-15T00:00:00.000Z'
    },
    {
        _id: 'proj_003',
        projectId: 'RC-003',
        projectName: 'Namakkal Poultry Farm Access Road',
        village: 'Rasipuram',
        district: 'Namakkal',
        state: 'Tamil Nadu',
        roadLength: 6.0,
        allocatedBudget: 31000000,
        amountSpent: 30800000,
        startDate: '2024-10-01',
        expectedCompletion: '2026-03-31',
        currentProgress: 100,
        status: 'Completed',
        contractor: 'Kongu Civil Contractors',
        description: 'Concrete pavement road for heavy feed transit trucks.',
        publicDescription: 'Completed 6.0 km concrete road with solar street lights and quality signboards.',
        isPublic: true,
        showContractor: true,
        showFinancialData: true,
        createdAt: '2024-10-01T00:00:00.000Z'
    },
    {
        _id: 'proj_004',
        projectId: 'RC-004',
        projectName: 'Coimbatore Village Connectivity Bypass',
        village: 'Pollachi Rural',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        roadLength: 10.0,
        allocatedBudget: 55000000,
        amountSpent: 42900000,
        startDate: '2025-02-10',
        expectedCompletion: '2026-08-30',
        currentProgress: 78,
        status: 'In Progress',
        contractor: 'Western Ghats Infra Construction',
        description: 'Rehabilitation of monsoon damaged village link road.',
        publicDescription: '78% completed paving work with reinforced shoulder drains.',
        isPublic: true,
        showContractor: true,
        showFinancialData: true,
        createdAt: '2025-02-10T00:00:00.000Z'
    },
    {
        _id: 'proj_005',
        projectId: 'RC-005',
        projectName: 'Tiruppur Textile Feeder Sector Road',
        village: 'Avinashi',
        district: 'Tiruppur',
        state: 'Tamil Nadu',
        roadLength: 7.0,
        allocatedBudget: 39000000,
        amountSpent: 13650000,
        startDate: '2025-11-01',
        expectedCompletion: '2026-09-15',
        currentProgress: 35,
        status: 'In Progress',
        contractor: 'Apex Garment Belt Infra',
        description: 'Heavy duty asphalt laying for industrial feeder traffic.',
        publicDescription: 'Earthwork preparation and culvert excavation in progress.',
        isPublic: true,
        showContractor: false,
        showFinancialData: true,
        createdAt: '2025-11-01T00:00:00.000Z'
    },
    {
        _id: 'proj_006',
        projectId: 'RC-006',
        projectName: 'Dindigul Hill Access Bypass Road',
        village: 'Kodaikanal Foothills',
        district: 'Dindigul',
        state: 'Tamil Nadu',
        roadLength: 14.0,
        allocatedBudget: 89000000,
        amountSpent: 17800000,
        startDate: '2025-01-15',
        expectedCompletion: '2026-05-30',
        currentProgress: 20,
        status: 'In Progress',
        contractor: 'Hilltop Engineers & Co',
        description: 'Slope cutting and gabion wall construction along hill slope.',
        publicDescription: 'Hillside earth clearing and gabion retaining wall construction.',
        isPublic: true,
        showContractor: true,
        showFinancialData: false,
        createdAt: '2025-01-15T00:00:00.000Z'
    },
    {
        _id: 'proj_007',
        projectId: 'RC-007',
        projectName: 'Thanjavur Delta Agriculture Access Road',
        village: 'Kumbakonam Rural',
        district: 'Thanjavur',
        state: 'Tamil Nadu',
        roadLength: 18.5,
        allocatedBudget: 94000000,
        amountSpent: 84600000,
        startDate: '2024-09-01',
        expectedCompletion: '2026-11-30',
        currentProgress: 90,
        status: 'In Progress',
        contractor: 'Cauvery Infra Developers',
        description: 'Paddy transport road connecting Delta farms to direct purchase centers.',
        publicDescription: '90% completed bituminous surface overlay with 4 culvert bridges.',
        isPublic: true,
        showContractor: true,
        showFinancialData: true,
        createdAt: '2024-09-01T00:00:00.000Z'
    }
];

class LocalStore {
    constructor() {
        this.data = { users: [], projects: INITIAL_PROJECTS, updates: [] };
        this.init();
    }

    init() {
        try {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            if (fs.existsSync(DB_FILE)) {
                const raw = fs.readFileSync(DB_FILE, 'utf8');
                this.data = JSON.parse(raw);
            } else {
                this.seedDefaultUsers();
                this.save();
            }
        } catch (err) {
            console.error('[LocalStore]: Init error, using memory defaults', err.message);
            this.seedDefaultUsers();
        }
    }

    seedDefaultUsers() {
        const salt = bcrypt.genSaltSync(10);
        this.data.users = [
            {
                _id: 'user_admin',
                name: 'Administrator',
                email: 'admin@ruralconnect.gov.in',
                password: bcrypt.hashSync('Admin@123', salt),
                role: 'ADMIN',
                createdAt: new Date().toISOString()
            },
            {
                _id: 'user_engineer',
                name: 'Er. Rajesh Kumar',
                email: 'engineer@ruralconnect.gov.in',
                password: bcrypt.hashSync('Engineer@123', salt),
                role: 'ENGINEER',
                createdAt: new Date().toISOString()
            },
            {
                _id: 'user_contractor',
                name: 'KPR Infrastructure',
                email: 'contractor@ruralconnect.gov.in',
                password: bcrypt.hashSync('Contractor@123', salt),
                role: 'CONTRACTOR',
                createdAt: new Date().toISOString()
            }
        ];
    }

    save() {
        try {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
        } catch (err) {
            console.error('[LocalStore]: Failed to persist data', err.message);
        }
    }

    findUserByEmail(email) {
        if (!email) return null;
        return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    findUserById(id) {
        if (!id) return null;
        return this.data.users.find(u => String(u._id) === String(id));
    }

    async createUser({ name, email, password, role }) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = {
            _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: ['ADMIN', 'ENGINEER', 'CONTRACTOR'].includes(role) ? role : 'ENGINEER',
            createdAt: new Date().toISOString()
        };
        this.data.users.push(newUser);
        this.save();
        return newUser;
    }

    async matchPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    getPublicProjects() {
        return (this.data.projects || []).filter(p => p.isPublic !== false).map(p => ({
            _id: p._id,
            projectId: p.projectId,
            projectName: p.projectName,
            village: p.village,
            district: p.district,
            state: p.state,
            roadLength: p.roadLength,
            currentProgress: p.currentProgress,
            status: p.status,
            startDate: p.startDate,
            expectedCompletion: p.expectedCompletion,
            publicDescription: p.publicDescription || p.description,
            showFinancialData: p.showFinancialData,
            showContractor: p.showContractor,
            allocatedBudget: p.showFinancialData ? p.allocatedBudget : undefined,
            amountSpent: p.showFinancialData ? p.amountSpent : undefined,
            remainingBudget: p.showFinancialData ? Math.max(0, p.allocatedBudget - p.amountSpent) : undefined,
            contractor: p.showContractor ? p.contractor : undefined,
            completion: p.completion || null
        }));
    }

    getAllProjects(user) {
        let list = this.data.projects || [];
        if (!user) return list;
        if (user.role === 'ADMIN') return list;
        if (user.role === 'ENGINEER') {
            return list.filter(p => 
                String(p.assignedEngineer) === String(user._id || user.id) || 
                String(p.createdBy) === String(user._id || user.id)
            );
        }
        if (user.role === 'CONTRACTOR') {
            return list.filter(p => 
                String(p.contractorId) === String(user._id || user.id) ||
                (p.contractor && p.contractor.toLowerCase() === (user.name || '').toLowerCase())
            );
        }
        return list;
    }

    getProjectById(id) {
        return (this.data.projects || []).find(p => String(p._id) === String(id) || p.projectId === id);
    }

    createProject(data, user) {
        const newProj = {
            _id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            projectId: data.projectId,
            projectName: data.projectName,
            village: data.village,
            district: data.district,
            state: data.state || 'Tamil Nadu',
            roadLength: Number(data.roadLength),
            allocatedBudget: Number(data.allocatedBudget),
            amountSpent: Number(data.amountSpent) || 0,
            startDate: data.startDate,
            expectedCompletion: data.expectedCompletion,
            currentProgress: Number(data.currentProgress) || 0,
            contractor: data.contractor || 'Unassigned Contractor',
            contractorId: data.contractorId || null,
            description: data.description || '',
            status: data.status || 'Planned',
            isPublic: data.isPublic !== undefined ? Boolean(data.isPublic) : true,
            showContractor: data.showContractor !== undefined ? Boolean(data.showContractor) : true,
            showFinancialData: data.showFinancialData !== undefined ? Boolean(data.showFinancialData) : true,
            publicDescription: data.publicDescription || data.description || '',
            assignedEngineer: data.assignedEngineer || (user.role === 'ENGINEER' ? user._id || user.id : null),
            createdBy: user._id || user.id,
            creatorRole: user.role,
            completion: null,
            createdAt: new Date().toISOString()
        };
        if (!this.data.projects) this.data.projects = [];
        this.data.projects.unshift(newProj);
        this.save();
        return newProj;
    }

    deleteProject(id) {
        const index = (this.data.projects || []).findIndex(p => String(p._id) === String(id) || p.projectId === id);
        if (index === -1) return false;
        this.data.projects.splice(index, 1);
        this.save();
        return true;
    }

    // Deletion Requests
    createDeletionRequest({ projectId, projectName, requestedBy, requestedByRole, reason }) {
        if (!this.data.deletionRequests) this.data.deletionRequests = [];
        const reqItem = {
            _id: 'delreq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            projectId,
            projectName,
            requestedBy: {
                _id: requestedBy._id || requestedBy.id,
                name: requestedBy.name,
                email: requestedBy.email,
                role: requestedByRole || requestedBy.role
            },
            requestedByRole: requestedByRole || requestedBy.role,
            reason,
            status: 'Pending',
            reviewedBy: null,
            reviewedAt: null,
            adminResponse: '',
            createdAt: new Date().toISOString()
        };
        this.data.deletionRequests.unshift(reqItem);
        this.save();
        return reqItem;
    }

    getDeletionRequests(user) {
        if (!this.data.deletionRequests) this.data.deletionRequests = [];
        if (!user || user.role === 'ADMIN') {
            return this.data.deletionRequests;
        }
        return this.data.deletionRequests.filter(r => 
            String(r.requestedBy?._id || r.requestedBy) === String(user._id || user.id)
        );
    }

    getDeletionRequestById(id) {
        if (!this.data.deletionRequests) this.data.deletionRequests = [];
        return this.data.deletionRequests.find(r => String(r._id) === String(id));
    }

    approveDeletionRequest(id, adminUser) {
        const reqItem = this.getDeletionRequestById(id);
        if (!reqItem) return null;

        // Delete the project
        this.deleteProject(reqItem.projectId);

        reqItem.status = 'Approved';
        reqItem.reviewedBy = {
            _id: adminUser._id || adminUser.id,
            name: adminUser.name,
            email: adminUser.email
        };
        reqItem.reviewedAt = new Date().toISOString();
        this.save();
        return reqItem;
    }

    rejectDeletionRequest(id, adminResponse, adminUser) {
        const reqItem = this.getDeletionRequestById(id);
        if (!reqItem) return null;

        reqItem.status = 'Rejected';
        reqItem.adminResponse = adminResponse || '';
        reqItem.reviewedBy = {
            _id: adminUser._id || adminUser.id,
            name: adminUser.name,
            email: adminUser.email
        };
        reqItem.reviewedAt = new Date().toISOString();
        this.save();
        return reqItem;
    }

    // Completion
    submitCompletion(projectId, { completionPercentage, completionDate, completionDescription, completionImage, contractorRemarks }, user) {
        const project = this.getProjectById(projectId);
        if (!project) return null;

        const perc = Number(completionPercentage);
        if (perc >= 100) {
            project.status = 'Completed';
            project.currentProgress = 100;
        }

        const completionRecord = {
            _id: 'comp_' + Date.now(),
            projectId: project._id,
            contractorId: {
                _id: user._id || user.id,
                name: user.name,
                email: user.email
            },
            completionPercentage: perc,
            completionDate,
            completionDescription,
            completionImage: completionImage || '',
            contractorRemarks: contractorRemarks || '',
            submittedAt: new Date().toISOString()
        };

        project.completion = {
            completionPercentage: perc,
            completionDate,
            completionDescription,
            completionImage: completionImage || '',
            contractorRemarks: contractorRemarks || '',
            submittedBy: user._id || user.id,
            submittedAt: completionRecord.submittedAt
        };

        if (!this.data.completions) this.data.completions = [];
        this.data.completions.push(completionRecord);
        this.save();
        return { project, completion: completionRecord };
    }

    getCompletion(projectId) {
        const project = this.getProjectById(projectId);
        if (project && project.completion) {
            return project.completion;
        }
        if (!this.data.completions) return null;
        return this.data.completions.find(c => String(c.projectId) === String(projectId)) || null;
    }

    // Public Queries
    createPublicQuery({ name, contactInfo, queryType, state, district, location, description, image, projectId }) {
        if (!this.data.publicQueries) this.data.publicQueries = [];
        const year = new Date().getFullYear();
        const count = this.data.publicQueries.length + 1;
        const queryId = `RCQ-${year}-${String(count).padStart(4, '0')}`;

        const newQuery = {
            _id: 'query_' + Date.now(),
            queryId,
            name,
            contactInfo: contactInfo || '',
            queryType,
            state,
            district,
            location,
            description,
            image: image || '',
            status: 'Pending',
            adminResponse: '',
            projectId: projectId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.data.publicQueries.unshift(newQuery);
        this.save();
        return newQuery;
    }

    getPublicQueries({ status, queryType, queryId } = {}) {
        let list = this.data.publicQueries || [];
        if (status && status !== 'All') {
            list = list.filter(q => q.status === status);
        }
        if (queryType && queryType !== 'All') {
            list = list.filter(q => q.queryType === queryType);
        }
        if (queryId) {
            list = list.filter(q => q.queryId.toLowerCase().includes(queryId.toLowerCase()));
        }
        return list;
    }

    getPublicQueryById(idOrQueryId) {
        if (!this.data.publicQueries) this.data.publicQueries = [];
        return this.data.publicQueries.find(q => String(q._id) === String(idOrQueryId) || q.queryId === idOrQueryId);
    }

    updatePublicQuery(idOrQueryId, { status, adminResponse }) {
        const query = this.getPublicQueryById(idOrQueryId);
        if (!query) return null;

        if (status) query.status = status;
        if (adminResponse !== undefined) query.adminResponse = adminResponse;
        query.updatedAt = new Date().toISOString();
        this.save();
        return query;
    }

    addProgressUpdate(projectId, { progress, notes, isPublic = true }, user) {
        const project = this.getProjectById(projectId);
        if (!project) return null;

        project.currentProgress = Number(progress);
        if (project.currentProgress >= 100) {
            project.status = 'Completed';
        } else if (project.currentProgress > 0) {
            project.status = 'Ongoing';
        }

        const update = {
            _id: 'upd_' + Date.now(),
            projectId: project._id,
            currentProgress: Number(progress),
            notes: notes || '',
            isPublic,
            updatedBy: {
                id: user._id || user.id,
                name: user.name,
                role: user.role
            },
            createdAt: new Date().toISOString()
        };

        if (!this.data.updates) this.data.updates = [];
        this.data.updates.push(update);
        this.save();
        return { project, update };
    }
}

module.exports = new LocalStore();

