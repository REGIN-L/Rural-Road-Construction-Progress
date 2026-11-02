const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const isServerless = Boolean(
    process.env.VERCEL || 
    process.env.VERCEL_ENV || 
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NOW_REGION
);

const DATA_DIR = isServerless ? path.join('/tmp', 'ruralconnect_data') : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');
const BUNDLED_DB_FILE = path.join(__dirname, '..', 'data', 'local_db.json');

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
            } else if (isServerless && fs.existsSync(BUNDLED_DB_FILE)) {
                const raw = fs.readFileSync(BUNDLED_DB_FILE, 'utf8');
                this.data = JSON.parse(raw);
                this.save();
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
            },
            {
                _id: '6ae35de2aa61c21ada558a6e',
                name: 'Ramesh Patel (Citizen)',
                email: 'citizen@ruralconnect.gov.in',
                password: bcrypt.hashSync('Citizen@123', salt),
                role: 'PUBLIC',
                village: 'Shivpur',
                district: 'Varanasi',
                state: 'Uttar Pradesh',
                phone: '9876543210',
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

    async matchPassword(enteredPassword, hashedPassword) {
        try {
            return await bcrypt.compare(enteredPassword, hashedPassword);
        } catch (err) {
            console.error('[LocalStore]: matchPassword error', err.message);
            return false;
        }
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

    getUsers() {
        return (this.data.users || []).map(u => ({
            _id: u._id,
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
            assignedProjectsCount: (this.data.projects || []).filter(p => String(p.assignedEngineer) === String(u._id) || String(p.contractorId) === String(u._id)).length
        }));
    }

    updateUserRole(id, role) {
        const user = this.findUserById(id);
        if (!user) return null;
        user.role = role;
        this.save();
        return user;
    }

    getPublicProjects() {
        return (this.data.projects || []).map(p => ({
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
            completion: p.completion || null,
            latitude: p.latitude || p.coordinates?.lat || null,
            longitude: p.longitude || p.coordinates?.lng || null,
            coordinates: p.coordinates || (p.latitude != null && p.longitude != null ? { lat: p.latitude, lng: p.longitude, path: [] } : null),
            isGeotagged: Boolean(p.isGeotagged || (p.latitude != null && p.longitude != null) || (p.coordinates?.lat != null && p.coordinates?.lng != null))
        }));
    }

    getAllProjects(user) {
        return this.data.projects || [];
    }

    getProjectById(id) {
        return (this.data.projects || []).find(p => String(p._id) === String(id) || p.projectId === id);
    }

    createProject(data, user) {
        if (!this.data.projects) this.data.projects = [];

        // Normalize status
        const statusMap = {
            'In Progress': 'Ongoing',
            'IN_PROGRESS': 'Ongoing',
            'Ongoing': 'Ongoing',
            'Not Started': 'Planned',
            'NOT_STARTED': 'Planned',
            'Planned': 'Planned',
            'On Track': 'Ongoing',
            'ON_TRACK': 'Ongoing',
            'Critical': 'Delayed',
            'CRITICAL': 'Delayed',
            'Delayed': 'Delayed',
            'DELAYED': 'Delayed',
            'Completed': 'Completed',
            'COMPLETED': 'Completed'
        };
        const initialProgress = Number(data.currentProgress) || 0;
        const initialStatus = statusMap[data.status] || (initialProgress >= 100 ? 'Completed' : (initialProgress > 0 ? 'Ongoing' : 'Planned'));

        // Ensure unique projectId
        let finalProjectId = data.projectId;
        if (!finalProjectId || !String(finalProjectId).trim()) {
            finalProjectId = `RC-${String(this.data.projects.length + 1).padStart(3, '0')}`;
        }
        let suffix = 1;
        const baseId = finalProjectId;
        while (this.data.projects.some(p => p.projectId === finalProjectId)) {
            finalProjectId = `${baseId}-${suffix++}`;
        }

        const newProj = {
            _id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            projectId: finalProjectId,
            projectName: data.projectName,
            village: data.village,
            district: data.district,
            state: data.state || 'Tamil Nadu',
            roadLength: Number(data.roadLength),
            allocatedBudget: Number(data.allocatedBudget),
            amountSpent: Number(data.amountSpent) || 0,
            startDate: data.startDate,
            expectedCompletion: data.expectedCompletion,
            currentProgress: initialProgress,
            contractor: data.contractor || 'Unassigned Contractor',
            contractorId: data.contractorId || null,
            description: data.description || '',
            status: initialStatus,
            isPublic: data.isPublic !== undefined ? Boolean(data.isPublic) : true,
            showContractor: data.showContractor !== undefined ? Boolean(data.showContractor) : true,
            showFinancialData: data.showFinancialData !== undefined ? Boolean(data.showFinancialData) : true,
            publicDescription: data.publicDescription || data.description || '',
            assignedEngineer: data.assignedEngineer || (user.role === 'ENGINEER' ? user._id || user.id : null),
            createdBy: user._id || user.id,
            creatorRole: user.role,
            completion: null,
            latitude: data.latitude !== undefined ? data.latitude : null,
            longitude: data.longitude !== undefined ? data.longitude : null,
            coordinates: data.coordinates || null,
            isGeotagged: Boolean(data.isGeotagged || (data.latitude != null && data.longitude != null)),
            createdAt: new Date().toISOString()
        };
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

    // Edit Requests
    createEditRequest({ projectId, projectName, projectCode, requestedBy, requestedByRole, requestedChanges, reason }) {
        if (!this.data.editRequests) this.data.editRequests = [];
        const reqItem = {
            _id: 'editreq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            projectId,
            projectName,
            projectCode: projectCode || '',
            requestedBy: {
                _id: requestedBy._id || requestedBy.id,
                name: requestedBy.name,
                email: requestedBy.email,
                role: requestedByRole || requestedBy.role
            },
            requestedByRole: requestedByRole || requestedBy.role,
            requestedChanges,
            reason,
            status: 'Pending',
            reviewedBy: null,
            reviewedAt: null,
            adminComment: '',
            createdAt: new Date().toISOString()
        };
        this.data.editRequests.unshift(reqItem);
        this.save();
        return reqItem;
    }

    getEditRequests(user) {
        if (!this.data.editRequests) this.data.editRequests = [];
        if (!user || user.role === 'ADMIN') {
            return this.data.editRequests;
        }
        return this.data.editRequests.filter(r => 
            String(r.requestedBy?._id || r.requestedBy) === String(user._id || user.id)
        );
    }

    getEditRequestById(id) {
        if (!this.data.editRequests) this.data.editRequests = [];
        return this.data.editRequests.find(r => String(r._id) === String(id));
    }

    approveEditRequest(id, adminComment, adminUser) {
        const reqItem = this.getEditRequestById(id);
        if (!reqItem) return null;

        const project = this.getProjectById(reqItem.projectId);
        if (project && reqItem.requestedChanges) {
            Object.assign(project, reqItem.requestedChanges);
            if (reqItem.requestedChanges.currentProgress !== undefined) {
                const p = Number(reqItem.requestedChanges.currentProgress);
                if (p >= 100) project.status = 'Completed';
            }
        }

        reqItem.status = 'Approved';
        reqItem.adminComment = adminComment || '';
        reqItem.reviewedBy = {
            _id: adminUser._id || adminUser.id,
            name: adminUser.name,
            email: adminUser.email
        };
        reqItem.reviewedAt = new Date().toISOString();
        this.save();
        return { editRequest: reqItem, project };
    }

    rejectEditRequest(id, adminComment, adminUser) {
        const reqItem = this.getEditRequestById(id);
        if (!reqItem) return null;

        reqItem.status = 'Rejected';
        reqItem.adminComment = adminComment || '';
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
    submitCompletion(projectId, { completionPercentage, completionDate, completionDescription, completionImage, completionPhoto, contractorRemarks, remarks }, user) {
        const project = this.getProjectById(projectId);
        if (!project) return null;

        const photo = (completionPhoto || completionImage || '').trim();
        const desc = (completionDescription || '').trim();
        const finalRemarks = (contractorRemarks || remarks || '').trim();

        project.status = 'Completed';
        project.currentProgress = 100;
        if (photo) {
            project.latestProgressPhoto = photo;
        }
        project.latestProgressUpdate = {
            progress: 100,
            workDescription: desc,
            photoUrl: photo,
            updatedAt: new Date().toISOString()
        };

        const completionRecord = {
            _id: 'comp_' + Date.now(),
            projectId: project._id,
            contractorId: {
                _id: user._id || user.id,
                name: user.name,
                email: user.email
            },
            completionPercentage: 100,
            completionDate: completionDate || new Date().toISOString(),
            completionDescription: desc,
            completionImage: photo,
            completionPhoto: photo,
            contractorRemarks: finalRemarks,
            submittedAt: new Date().toISOString()
        };

        project.completion = {
            completionPercentage: 100,
            completionDate: completionRecord.completionDate,
            completionDescription: desc,
            completionImage: photo,
            completionPhoto: photo,
            contractorRemarks: finalRemarks,
            submittedBy: user._id || user.id,
            submittedAt: completionRecord.submittedAt
        };

        if (!this.data.completions) this.data.completions = [];
        this.data.completions.push(completionRecord);

        // Also add historical 100% progress update
        this.addProgressUpdate(projectId, {
            progress: 100,
            progressPercentage: 100,
            workDescription: `Project Completed: ${desc}`,
            notes: `Project Completed: ${desc}`,
            photoUrl: photo,
            remarks: finalRemarks,
            isPublic: true
        }, user);

        this.save();
        return { project, completion: completionRecord };
    }

    getCompletion(projectId) {
        const project = this.getProjectById(projectId);
        if (project && project.completion) {
            return project.completion;
        }
        if (!this.data.completions) return null;
        const targetIds = project ? [String(project._id), String(project.projectId)] : [String(projectId)];
        return this.data.completions.find(c => targetIds.includes(String(c.projectId))) || null;
    }

    // Public Queries
    createPublicQuery({ name, contactInfo, queryType, requestType, roadName, startPoint, endPoint, reason, urgency, state, district, location, village, description, image, projectId, submittedByUserId }) {
        if (!this.data.publicQueries) this.data.publicQueries = [];
        const year = new Date().getFullYear();
        const prefix = `RCQ-${year}-`;

        let maxNum = 0;
        this.data.publicQueries.forEach(q => {
            const m = q.queryId && q.queryId.match(/RCQ-\d{4}-(\d+)/);
            if (m) {
                const num = parseInt(m[1], 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        });

        let nextNum = maxNum + 1;
        let queryId = `${prefix}${String(nextNum).padStart(4, '0')}`;
        while (this.data.publicQueries.some(q => q.queryId === queryId)) {
            nextNum++;
            queryId = `${prefix}${String(nextNum).padStart(4, '0')}`;
        }

        const newQuery = {
            _id: 'query_' + Date.now(),
            queryId,
            name,
            contactInfo: contactInfo || '',
            queryType: queryType || (requestType === 'NEW_ROAD_REQUEST' ? 'Request New Road' : 'General Feedback'),
            requestType: requestType || 'FEEDBACK',
            roadName: roadName || '',
            startPoint: startPoint || '',
            endPoint: endPoint || '',
            reason: reason || '',
            urgency: urgency || 'Medium',
            state: state || 'Tamil Nadu',
            district,
            location: location || village || '',
            village: village || location || '',
            description,
            image: image || '',
            status: 'Submitted',
            adminResponse: '',
            projectId: projectId || null,
            submittedByUserId: (submittedByUserId && mongoose.Types.ObjectId.isValid(submittedByUserId))
                ? String(submittedByUserId)
                : (submittedByUserId === 'user_citizen' ? '6ae35de2aa61c21ada558a6e' : null),
            isApprovedForProject: false,
            createdProjectId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.data.publicQueries.unshift(newQuery);
        this.save();
        return newQuery;
    }

    getPublicQueries({ status, queryType, queryId, requestType } = {}) {
        let list = this.data.publicQueries || [];
        if (status && status !== 'All') {
            if (status === 'Submitted' || status === 'Pending') {
                list = list.filter(q => q.status === 'Submitted' || q.status === 'Pending');
            } else {
                list = list.filter(q => q.status === status);
            }
        }
        if (queryType && queryType !== 'All') {
            list = list.filter(q => q.queryType === queryType);
        }
        if (requestType && requestType !== 'All') {
            list = list.filter(q => q.requestType === requestType);
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

    addProgressUpdate(projectId, { progress, progressPercentage, workDescription, notes, photoUrl, remarks, isPublic = true, amountSpent }, user) {
        const project = this.getProjectById(projectId);
        if (!project) return null;

        const perc = Number(progressPercentage !== undefined ? progressPercentage : progress);
        const desc = (workDescription || notes || '').trim();
        const photo = (photoUrl || '').trim();

        project.currentProgress = perc;
        if (perc >= 100) {
            project.status = 'Completed';
        } else if (perc > 0 && (project.status === 'Planned' || project.status === 'NOT_STARTED')) {
            project.status = 'Ongoing';
        }

        if (photo) {
            project.latestProgressPhoto = photo;
        }

        project.latestProgressUpdate = {
            progress: perc,
            workDescription: desc,
            photoUrl: photo,
            updatedAt: new Date().toISOString()
        };

        if (amountSpent !== undefined) {
            project.amountSpent = Number(amountSpent);
        }

        const update = {
            _id: 'upd_' + Date.now(),
            projectId: project._id,
            progress: perc,
            progressPercentage: perc,
            workDescription: desc,
            notes: desc,
            photoUrl: photo,
            remarks: remarks || '',
            amountSpent: project.amountSpent,
            isPublic,
            updatedBy: {
                id: user._id || user.id,
                name: user.name,
                role: user.role
            },
            contractorId: user.role === 'CONTRACTOR' ? (user._id || user.id) : (project.contractorId || null),
            contractorName: user.role === 'CONTRACTOR' ? user.name : (project.contractor || ''),
            createdAt: new Date().toISOString()
        };

        if (!this.data.updates) this.data.updates = [];
        this.data.updates.unshift(update);
        this.save();
        return { project, update };
    }

    getProgressUpdates(projectId) {
        if (!this.data.updates) this.data.updates = [];
        const project = this.getProjectById(projectId);
        const targetIds = project ? [String(project._id), String(project.projectId)] : [String(projectId)];
        return this.data.updates.filter(u => targetIds.includes(String(u.projectId)));
    }
}

module.exports = new LocalStore();

