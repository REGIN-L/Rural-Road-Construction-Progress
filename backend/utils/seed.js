const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('../models/Project');
const ProgressUpdate = require('../models/ProgressUpdate');
const Expense = require('../models/Expense');
const { calculateProjectStatus } = require('./statusCalculator');

dotenv.config({ path: __dirname + '/../.env' });

const seedData = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ruralconnect';
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log('[Seed]: Connected to MongoDB');

        // Clear project-related data only; never create or delete user accounts here.
        await Project.deleteMany();
        await ProgressUpdate.deleteMany();
        await Expense.deleteMany();

        const admin = { _id: null };
        const engineer = { _id: null };

        // 8 Sample Tamil Nadu Rural Road Projects
        const projectsData = [
            {
                projectId: 'RC-001',
                projectName: 'Erode – Perundurai Village Road',
                village: 'Perundurai',
                district: 'Erode',
                state: 'Tamil Nadu',
                roadLength: 8.5,
                allocatedBudget: 42500000, // ₹4.25 Cr
                amountSpent: 2762500,     // ₹27.62 Lakhs
                startDate: '2025-06-01',
                expectedCompletion: '2026-12-31',
                currentProgress: 65,
                contractor: 'KPR Infrastructure Pvt Ltd',
                description: 'Bituminous surface paving linking agricultural farms to Perundurai market yard.',
                publicDescription: 'Upgrading 8.5 km single-lane dirt road to 2-lane asphalt road with cross-drainage culverts.',
                isPublic: true,
                showContractor: true,
                showFinancialData: true,
                assignedEngineer: engineer._id
            },
            {
                projectId: 'RC-002',
                projectName: 'Salem – Omalur Rural Link Corridor',
                village: 'Omalur',
                district: 'Salem',
                state: 'Tamil Nadu',
                roadLength: 12.0,
                allocatedBudget: 68000000, // ₹6.8 Cr
                amountSpent: 2856000,
                startDate: '2025-08-15',
                expectedCompletion: '2026-10-15',
                currentProgress: 42,
                contractor: 'Salem Earthmovers & Builders',
                description: 'Widening of rural corridor connecting textile units to state highway.',
                publicDescription: 'Construction of Sub-base macadam and embankment retaining wall along Salem sector.',
                isPublic: true,
                showContractor: true,
                showFinancialData: true,
                assignedEngineer: engineer._id
            },
            {
                projectId: 'RC-003',
                projectName: 'Namakkal Poultry Farm Access Road',
                village: 'Rasipuram',
                district: 'Namakkal',
                state: 'Tamil Nadu',
                roadLength: 6.0,
                allocatedBudget: 31000000, // ₹3.1 Cr
                amountSpent: 30800000,
                startDate: '2024-10-01',
                expectedCompletion: '2026-03-31',
                currentProgress: 100,
                contractor: 'Kongu Civil Contractors',
                description: 'Concrete pavement road for heavy feed transit trucks.',
                publicDescription: 'Completed 6.0 km concrete road with solar street lights and quality signboards.',
                isPublic: true,
                showContractor: true,
                showFinancialData: true,
                assignedEngineer: engineer._id
            },
            {
                projectId: 'RC-004',
                projectName: 'Coimbatore Village Connectivity Bypass',
                village: 'Pollachi Rural',
                district: 'Coimbatore',
                state: 'Tamil Nadu',
                roadLength: 10.0,
                allocatedBudget: 55000000, // ₹5.5 Cr
                amountSpent: 42900000,
                startDate: '2025-02-10',
                expectedCompletion: '2026-08-30',
                currentProgress: 78,
                contractor: 'Western Ghats Infra Construction',
                description: 'Rehabilitation of monsoon damaged village link road.',
                publicDescription: '78% completed paving work with reinforced shoulder drains.',
                isPublic: true,
                showContractor: true,
                showFinancialData: true,
                assignedEngineer: admin._id
            },
            {
                projectId: 'RC-005',
                projectName: 'Tiruppur Textile Feeder Sector Road',
                village: 'Avinashi',
                district: 'Tiruppur',
                state: 'Tamil Nadu',
                roadLength: 7.0,
                allocatedBudget: 39000000, // ₹3.9 Cr
                amountSpent: 13650000,
                startDate: '2025-11-01',
                expectedCompletion: '2026-09-15',
                currentProgress: 35,
                contractor: 'Apex Garment Belt Infra',
                description: 'Heavy duty asphalt laying for industrial feeder traffic.',
                publicDescription: 'Earthwork preparation and culvert excavation in progress.',
                isPublic: true,
                showContractor: false,
                showFinancialData: true,
                assignedEngineer: engineer._id
            },
            {
                projectId: 'RC-006',
                projectName: 'Dindigul Hill Access Bypass Road',
                village: 'Kodaikanal Foothills',
                district: 'Dindigul',
                state: 'Tamil Nadu',
                roadLength: 14.0,
                allocatedBudget: 89000000, // ₹8.9 Cr
                amountSpent: 17800000,
                startDate: '2025-01-15',
                expectedCompletion: '2026-05-30',
                currentProgress: 20,
                contractor: 'Hilltop Engineers & Co',
                description: 'Slope cutting and gabion wall construction along hill slope.',
                publicDescription: 'Hillside earth clearing and gabion retaining wall construction.',
                isPublic: true,
                showContractor: true,
                showFinancialData: false,
                assignedEngineer: engineer._id
            },
            {
                projectId: 'RC-007',
                projectName: 'Thanjavur Delta Agriculture Access Road',
                village: 'Kumbakonam Rural',
                district: 'Thanjavur',
                state: 'Tamil Nadu',
                roadLength: 18.5,
                allocatedBudget: 94000000, // ₹9.4 Cr
                amountSpent: 84600000,
                startDate: '2024-09-01',
                expectedCompletion: '2026-11-30',
                currentProgress: 90,
                contractor: 'Cauvery Infra Developers',
                description: 'Paddy transport road connecting Delta farms to direct purchase centers.',
                publicDescription: '90% completed bituminous surface overlay with 4 culvert bridges.',
                isPublic: true,
                showContractor: true,
                showFinancialData: true,
                assignedEngineer: admin._id
            },
            {
                projectId: 'RC-008',
                projectName: 'Madurai Ring Road Expressway Link',
                village: 'Thirumangalam',
                district: 'Madurai',
                state: 'Tamil Nadu',
                roadLength: 11.0,
                allocatedBudget: 62000000, // ₹6.2 Cr
                amountSpent: 31000000,
                startDate: '2025-05-10',
                expectedCompletion: '2027-01-31',
                currentProgress: 50,
                contractor: 'Pandyan Construction Works',
                description: 'Expressway feeder connector for rural produce transit.',
                publicDescription: 'Internal administrative monitoring project.',
                isPublic: false, // Private project test
                showContractor: true,
                showFinancialData: true,
                assignedEngineer: engineer._id
            }
        ];

        const createdProjects = [];
        for (const p of projectsData) {
            const computedStatus = calculateProjectStatus(p.startDate, p.expectedCompletion, p.currentProgress);
            const proj = await Project.create({
                ...p,
                status: computedStatus
            });
            createdProjects.push(proj);
        }

        console.log(`[Seed]: Created ${createdProjects.length} Tamil Nadu projects`);

        // Add Progress Updates for RC-001
        const rc001 = createdProjects[0];
        await ProgressUpdate.create([
            {
                projectId: rc001._id,
                progress: 65,
                amountSpent: 2762500,
                notes: 'Base course compaction work completed. Asphalt paver machine deployed.',
                updatedBy: engineer._id,
                isPublic: true
            },
            {
                projectId: rc001._id,
                progress: 52,
                amountSpent: 2210000,
                notes: 'Drainage culvert concrete pouring completed near km 4+200.',
                updatedBy: engineer._id,
                isPublic: true
            },
            {
                projectId: rc001._id,
                progress: 40,
                amountSpent: 1700000,
                notes: 'Road bed earthwork grading and sub-grade stone layer laid.',
                updatedBy: engineer._id,
                isPublic: true
            }
        ]);

        // Add Sample Expenses for RC-001 & RC-002
        await Expense.create([
            {
                projectId: rc001._id,
                category: 'Materials',
                amount: 1250000,
                description: 'Crushed stone aggregate and bitumen drums purchase',
                date: '2025-11-10',
                createdBy: engineer._id
            },
            {
                projectId: rc001._id,
                category: 'Labour',
                amount: 850000,
                description: 'Wages for site compaction crew and supervisors',
                date: '2025-12-20',
                createdBy: engineer._id
            },
            {
                projectId: rc001._id,
                category: 'Equipment',
                amount: 662500,
                description: 'Vibratory roller compactor diesel & daily rental',
                date: '2026-02-14',
                createdBy: engineer._id
            }
        ]);

        console.log('[Seed]: Seed script completed successfully!');
    } catch (error) {
        console.error('[Seed Error]:', error);
    } finally {
        mongoose.disconnect();
    }
};

if (require.main === module) {
    seedData();
}

module.exports = seedData;
