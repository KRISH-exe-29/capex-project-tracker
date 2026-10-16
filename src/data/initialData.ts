import { 
  Project, 
  ProjectPhase,
  ProjectPart,
  Section, 
  Milestone, 
  Task, 
  SubWork, 
  TeamMember, 
  DprRecord, 
  ProjectDocument, 
  UserPermission, 
  RoleDefinition 
} from '../types/capex'

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-500',
    code: 'CPX-2026-500',
    name: 'Mega Industrial Infrastructure Plant (500 Cr)',
    approvedAmount: 5000000000, // ₹ 500.00 Cr
    approvedDate: '2026-03-04',
    startDate: '2026-03-04',
    endDate: '2028-12-31',
    executionTimeline: '34 Months',
    estimatedCost: 4950000000,
    poValue: 850000000,
    balanceAmount: 4150000000,
    status: 'Active',
    location: 'Industrial Mega Park, Zone 4',
    description: 'Overall ₹500 Cr approved capital expenditure project split across Phase I (135 Cr) and Phase II (365 Cr), with Part 1 (100 Cr) and Part II (35 Cr) sub-allocations into Civil, MEP, and Winding sections.'
  },
  {
    id: 'proj-001',
    code: 'CPX-2026-001',
    name: 'Bhiwandi Automated Fulfillment Logistics Hub (Phase 2)',
    approvedAmount: 185000000, // ₹ 18.50 Cr
    approvedDate: '2026-01-15',
    endDate: '2027-06-30',
    executionTimeline: '18 Months',
    estimatedCost: 172000000,
    poValue: 89100000, // Aggregated from sub-works
    balanceAmount: 95900000, // 18.5Cr - 8.91Cr
    status: 'Active',
    location: 'Bhiwandi Logistics SEZ, Maharashtra',
    description: 'Next-gen 400,000 sq.ft omni-channel automated warehouse with high-speed cross-belt sorter and automated storage retrieval.'
  },
  {
    id: 'proj-002',
    code: 'CPX-2026-002',
    name: 'Solar-Powered Cold Storage & Ripening Unit - Pune',
    approvedAmount: 94000000, // ₹ 9.40 Cr
    approvedDate: '2026-02-10',
    endDate: '2026-12-31',
    executionTimeline: '11 Months',
    estimatedCost: 96500000, // Exceeds approved: triggers variance warning!
    poValue: 48500000,
    balanceAmount: 45500000,
    status: 'Active',
    location: 'Chakan Industrial Area, Pune',
    description: 'Controlled atmosphere multi-chamber cold storage with 1.2MW rooftop solar PV generation and ammonia refrigeration.'
  },
  {
    id: 'proj-003',
    code: 'CPX-2026-003',
    name: 'Corporate R&D Innovation Campus - Bengaluru',
    approvedAmount: 320000000, // ₹ 32.00 Cr
    approvedDate: '2026-03-01',
    endDate: '2028-02-28',
    executionTimeline: '24 Months',
    estimatedCost: 310000000,
    poValue: 125000000,
    balanceAmount: 195000000,
    status: 'Active',
    location: 'Whitefield Tech Zone, Bengaluru',
    description: 'Advanced semiconductor prototyping lab, cleanrooms, and Tier-3 green data center infrastructure.'
  },
  {
    id: 'proj-004',
    code: 'CPX-2026-004',
    name: 'Green Hydrogen Pilot Electrolyzer Facility - Gujarat',
    approvedAmount: 45000000, // ₹ 4.50 Cr
    approvedDate: '2026-04-05',
    endDate: '2026-11-30',
    executionTimeline: '8 Months',
    estimatedCost: 43000000,
    poValue: 16000000,
    balanceAmount: 29000000,
    status: 'Planning',
    location: 'Dahej Petroleum & Chemical Petrochemicals Zone, Gujarat',
    description: 'PEM electrolyzer pilot plant for zero-carbon captive hydrogen generation with cryogenic storage vessels.'
  }
]

export const INITIAL_PHASES: ProjectPhase[] = [
  // 500 Cr Showcase Project Phases
  {
    id: 'phase-501',
    projectId: 'proj-500',
    wbsNumber: '1.1',
    name: 'Phase I',
    budgetAmount: 1350000000, // ₹ 135.00 Cr
    capexApprovalDate: '2026-03-04',
    startDate: '2026-03-04',
    endDate: '2027-08-31',
    status: 'Active',
    description: 'Phase I Capital Allocation (₹ 135 Cr) covering primary plant civil foundations, MEP utilities, and coil winding assembly.'
  },
  {
    id: 'phase-502',
    projectId: 'proj-500',
    wbsNumber: '1.2',
    name: 'Phase II',
    budgetAmount: 3650000000, // ₹ 365.00 Cr
    capexApprovalDate: '2026-08-15',
    startDate: '2027-09-01',
    endDate: '2028-12-31',
    status: 'Planning',
    description: 'Phase II Capital Allocation (₹ 365 Cr) for secondary high-capacity expansion, robotic material handling, and cleanrooms.'
  },
  // Project 1 Phases
  {
    id: 'phase-101',
    projectId: 'proj-001',
    wbsNumber: '1.1',
    name: 'Phase I',
    budgetAmount: 110000000,
    capexApprovalDate: '2026-01-15',
    startDate: '2026-01-15',
    endDate: '2026-10-31',
    status: 'Active',
    description: 'Civil and main PEB building infrastructure.'
  },
  {
    id: 'phase-102',
    projectId: 'proj-001',
    wbsNumber: '1.2',
    name: 'Phase II',
    budgetAmount: 75000000,
    capexApprovalDate: '2026-06-01',
    startDate: '2026-11-01',
    endDate: '2027-06-30',
    status: 'Planning',
    description: 'Automated warehouse sorter installation.'
  }
]

export const INITIAL_PARTS: ProjectPart[] = [
  // 500 Cr Showcase Project Parts (under Phase I)
  {
    id: 'part-5011',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    wbsNumber: '1.1.1',
    name: 'Part 1',
    budgetAmount: 1000000000, // ₹ 100.00 Cr
    status: 'Active',
    description: 'Part 1 Allocation (₹ 100 Cr) covering Civil, MEP, and Winding sections.'
  },
  {
    id: 'part-5012',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    wbsNumber: '1.1.2',
    name: 'Part II',
    budgetAmount: 350000000, // ₹ 35.00 Cr
    status: 'Planning',
    description: 'Part II Allocation (₹ 35 Cr) for auxiliary utilities and raw material logistics.'
  },
  // Project 1 Parts
  {
    id: 'part-1011',
    projectId: 'proj-001',
    phaseId: 'phase-101',
    wbsNumber: '1.1.1',
    name: 'Part 1',
    budgetAmount: 70000000,
    status: 'Active',
    description: 'Foundation and heavy structural framing.'
  },
  {
    id: 'part-1012',
    projectId: 'proj-001',
    phaseId: 'phase-101',
    wbsNumber: '1.1.2',
    name: 'Part 2',
    budgetAmount: 40000000,
    status: 'Planning',
    description: 'Enclosure and interior concrete works.'
  }
]

export const INITIAL_SECTIONS: Section[] = [
  // 500 Cr Showcase Project Sections (Civil, MEP, Winding under Part 1)
  {
    id: 'sec-50111',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    partId: 'part-5011',
    wbsNumber: '1.1.1.1',
    name: 'Civil',
    description: 'Heavy industrial civil foundations, concrete plinths, and structural PEB steel.'
  },
  {
    id: 'sec-50112',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    partId: 'part-5011',
    wbsNumber: '1.1.1.2',
    name: 'MEP',
    description: '33kV electrical substation, industrial HVAC chilling lines, and fire sprinkler systems.'
  },
  {
    id: 'sec-50113',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    partId: 'part-5011',
    wbsNumber: '1.1.1.3',
    name: 'Winding',
    description: 'High-speed automated stator & coil winding automation lines and machine beds.'
  },
  // Project 1 Sections
  {
    id: 'sec-101',
    projectId: 'proj-001',
    phaseId: 'phase-101',
    partId: 'part-1011',
    wbsNumber: '1.1.1.1',
    name: 'Civil Foundations & Sub-Structure Works',
    description: 'Deep foundation piling, grading, excavation, and structural concrete plinths.'
  },
  {
    id: 'sec-102',
    projectId: 'proj-001',
    wbsNumber: '1.2',
    name: 'Structural Pre-Engineered Building (PEB) & Enclosure',
    description: 'Heavy structural steel framing, roof standing seam sheets, and insulated wall cladding.'
  },
  {
    id: 'sec-103',
    projectId: 'proj-001',
    wbsNumber: '1.3',
    name: 'Automation Conveyors & Sorter Systems',
    description: 'Mezzanine steel erection, high-speed sorting loops, and barcode scanning gantries.'
  },
  {
    id: 'sec-104',
    projectId: 'proj-001',
    wbsNumber: '1.4',
    name: 'High-Voltage Electrical, MEP & Fire Safety',
    description: '33kV substation, diesel generator sets, FM Global standard fire hydrant piping.'
  },
  // Project 2 Sections
  {
    id: 'sec-201',
    projectId: 'proj-002',
    wbsNumber: '2.1',
    name: 'Thermal Insulation & Refrigeration Infrastructure',
    description: 'PIR insulated sandwich panels and screw compressor chilling plants.'
  },
  {
    id: 'sec-202',
    projectId: 'proj-002',
    wbsNumber: '2.2',
    name: 'Rooftop Solar PV Generation & Net Metering',
    description: 'Monocrystalline solar arrays, string inverters, and switchgear.'
  },
  // Project 3 Sections
  {
    id: 'sec-301',
    projectId: 'proj-003',
    wbsNumber: '3.1',
    name: 'Modular Cleanroom & Environmental Chambers',
    description: 'ISO Class 5 & Class 7 cleanroom envelope with precision HVAC.'
  }
]

export const INITIAL_MILESTONES: Milestone[] = [
  // Under Section 1.1
  {
    id: 'ms-1011',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    wbsNumber: '1.1.1',
    name: 'Sub-structure Excavation & Bored Piling',
    startDate: '2026-02-01',
    targetDate: '2026-04-15',
    status: 'Completed',
    progress: 100
  },
  {
    id: 'ms-1012',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    wbsNumber: '1.1.2',
    name: 'Heavy Raft Slab Casting & Plinth Beams',
    startDate: '2026-04-16',
    targetDate: '2026-06-30',
    status: 'In Progress',
    progress: 65
  },
  // Under Section 1.2
  {
    id: 'ms-1021',
    projectId: 'proj-001',
    sectionId: 'sec-102',
    wbsNumber: '1.2.1',
    name: 'PEB Superstructure Fabrication & Erection',
    startDate: '2026-06-01',
    targetDate: '2026-10-15',
    status: 'In Progress',
    progress: 40
  },
  // Under Section 1.3
  {
    id: 'ms-1031',
    projectId: 'proj-001',
    sectionId: 'sec-103',
    wbsNumber: '1.3.1',
    name: 'High-Speed Cross-Belt Sorter Installation',
    startDate: '2026-10-01',
    targetDate: '2027-02-28',
    status: 'Not Started',
    progress: 0
  },
  // Under Section 2.1
  {
    id: 'ms-2011',
    projectId: 'proj-002',
    sectionId: 'sec-201',
    wbsNumber: '2.1.1',
    name: 'Screw Compressor Chilling Plant Commissioning',
    startDate: '2026-03-01',
    targetDate: '2026-08-30',
    status: 'In Progress',
    progress: 55
  },
  // Under Section 3.1
  {
    id: 'ms-3011',
    projectId: 'proj-003',
    sectionId: 'sec-301',
    wbsNumber: '3.1.1',
    name: 'Cleanroom ISO Envelope & AHU Integration',
    startDate: '2026-04-01',
    targetDate: '2026-11-30',
    status: 'In Progress',
    progress: 30
  }
]

export const INITIAL_TASKS: Task[] = [
  // 500 Cr Project Work Packages (under Civil, MEP, Winding)
  {
    id: 'tsk-501111',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    partId: 'part-5011',
    sectionId: 'sec-50111',
    wbsNumber: '1.1.1.1.1',
    name: 'Sub-structure Piling & Heavy Excavation',
    startDate: '2026-03-10',
    targetDate: '2026-06-30',
    status: 'In Progress',
    progress: 45
  },
  {
    id: 'tsk-501112',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    partId: 'part-5011',
    sectionId: 'sec-50111',
    wbsNumber: '1.1.1.1.2',
    name: 'RCC Foundation Plinths & Heavy Equipment Beds',
    startDate: '2026-06-01',
    targetDate: '2026-09-30',
    status: 'Pending',
    progress: 10
  },
  {
    id: 'tsk-501121',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    partId: 'part-5011',
    sectionId: 'sec-50112',
    wbsNumber: '1.1.1.2.1',
    name: '33kV Substation & Primary HT Transformers',
    startDate: '2026-05-01',
    targetDate: '2026-11-15',
    status: 'Pending',
    progress: 15
  },
  {
    id: 'tsk-501131',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    partId: 'part-5011',
    sectionId: 'sec-50113',
    wbsNumber: '1.1.1.3.1',
    name: 'Automated Precision Coil Winding Machinery Setup',
    startDate: '2026-08-01',
    targetDate: '2027-02-28',
    status: 'Pending',
    progress: 0
  },
  // Under Milestone 1.1.1
  {
    id: 'tsk-10111',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    milestoneId: 'ms-1011',
    wbsNumber: '1.1.1.1',
    name: 'Geotechnical Borehole Verification & Soil Tests',
    startDate: '2026-02-01',
    targetDate: '2026-02-20',
    status: 'Completed',
    progress: 100
  },
  {
    id: 'tsk-10112',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    milestoneId: 'ms-1011',
    wbsNumber: '1.1.1.2',
    name: 'Cast-in-situ Bored Piling (600mm dia - 240 units)',
    startDate: '2026-02-21',
    targetDate: '2026-04-10',
    status: 'Completed',
    progress: 100
  },
  // Under Milestone 1.1.2
  {
    id: 'tsk-10121',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    milestoneId: 'ms-1012',
    wbsNumber: '1.1.2.1',
    name: 'Formwork Shuttering & Waterproofing Membrane',
    startDate: '2026-04-16',
    targetDate: '2026-05-25',
    status: 'In Progress',
    progress: 80
  },
  {
    id: 'tsk-10122',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    milestoneId: 'ms-1012',
    wbsNumber: '1.1.2.2',
    name: 'High-Strength M40 Concrete Plinth Pouring',
    startDate: '2026-05-26',
    targetDate: '2026-06-30',
    status: 'Pending',
    progress: 20
  },
  // Under Milestone 1.2.1
  {
    id: 'tsk-10211',
    projectId: 'proj-001',
    sectionId: 'sec-102',
    milestoneId: 'ms-1021',
    wbsNumber: '1.2.1.1',
    name: 'Structural Steel Column & Rafter Fabrication',
    startDate: '2026-06-01',
    targetDate: '2026-08-15',
    status: 'In Progress',
    progress: 50
  },
  // Under Milestone 1.3.1
  {
    id: 'tsk-10311',
    projectId: 'proj-001',
    sectionId: 'sec-103',
    milestoneId: 'ms-1031',
    wbsNumber: '1.3.1.1',
    name: 'Precision Mezzanine Steel Platform Erection',
    startDate: '2026-10-01',
    targetDate: '2026-12-15',
    status: 'Pending',
    progress: 0
  },
  // Under Milestone 2.1.1
  {
    id: 'tsk-20111',
    projectId: 'proj-002',
    sectionId: 'sec-201',
    milestoneId: 'ms-2011',
    wbsNumber: '2.1.1.1',
    name: 'Screw Compressor Installation & Pipe Insulation',
    startDate: '2026-03-15',
    targetDate: '2026-07-20',
    status: 'In Progress',
    progress: 60
  },
  // Under Milestone 3.1.1
  {
    id: 'tsk-30111',
    projectId: 'proj-003',
    sectionId: 'sec-301',
    milestoneId: 'ms-3011',
    wbsNumber: '3.1.1.1',
    name: 'Variable Air Volume (VAV) & HEPA Filtration Setup',
    startDate: '2026-04-10',
    targetDate: '2026-09-30',
    status: 'In Progress',
    progress: 40
  }
]

export const INITIAL_SUBWORKS: SubWork[] = [
  // 500 Cr Project Sub-works (Civil, MEP, Winding)
  {
    id: 'sw-5011111',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    partId: 'part-5011',
    sectionId: 'sec-50111',
    taskId: 'tsk-501111',
    wbsNumber: '1.1.1.1.1.1',
    workDescription: 'Rotary hydraulic piling rigs and site earthwork excavation',
    supplierName: 'Larsen & Toubro Heavy Civil Infra',
    bpCode: 'BP-LT-8812',
    targetDate: '2026-06-15',
    poNumber: 'PO-500-CIV-001',
    poValueGst: 350000000, // ₹ 35.00 Cr
    paidDate: '2026-04-10',
    status: 'In Execution'
  },
  {
    id: 'sw-5011211',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    partId: 'part-5011',
    sectionId: 'sec-50112',
    taskId: 'tsk-501121',
    wbsNumber: '1.1.1.2.1.1',
    workDescription: '33kV GIS switchgear, 20MVA power transformers & busducts',
    supplierName: 'ABB Power Grids India Ltd',
    bpCode: 'BP-ABB-9921',
    targetDate: '2026-10-30',
    poNumber: 'PO-500-MEP-001',
    poValueGst: 285000000, // ₹ 28.50 Cr
    paidDate: '',
    status: 'PO Issued'
  },
  {
    id: 'sw-5011311',
    projectId: 'proj-500',
    phaseId: 'phase-501',
    partId: 'part-5011',
    sectionId: 'sec-50113',
    taskId: 'tsk-501131',
    wbsNumber: '1.1.1.3.1.1',
    workDescription: 'Robotic multi-axis coil winding cells with electronic tension control',
    supplierName: 'Aumann Automated Systems GmbH',
    bpCode: 'BP-AUM-7734',
    targetDate: '2027-01-31',
    poNumber: 'PO-500-WND-001',
    poValueGst: 215000000, // ₹ 21.50 Cr
    paidDate: '',
    status: 'PO Issued'
  },
  // Under Task 1.1.1.1
  {
    id: 'sw-101111',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    milestoneId: 'ms-1011',
    taskId: 'tsk-10111',
    wbsNumber: '1.1.1.1.1',
    workDescription: 'Plate Load Testing & Stratum Compaction Analysis',
    supplierName: 'Keller Ground Engineering India Pvt Ltd',
    bpCode: 'BP-40112',
    targetDate: '2026-02-15',
    poNumber: 'PO-2026-0182',
    poValueGst: 1850000, // ₹ 18.50 L
    paidDate: '2026-03-10',
    status: 'Paid'
  },
  {
    id: 'sw-101112',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    milestoneId: 'ms-1011',
    taskId: 'tsk-10111',
    wbsNumber: '1.1.1.1.2',
    workDescription: 'Diamond Rotary Rig Core Drilling & Permeability Tests',
    supplierName: 'GeoTech India Advisory Services',
    bpCode: 'BP-40115',
    targetDate: '2026-02-20',
    poNumber: 'PO-2026-0185',
    poValueGst: 1200000, // ₹ 12.00 L
    paidDate: '2026-03-22',
    status: 'Paid'
  },
  // Under Task 1.1.1.2
  {
    id: 'sw-101121',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    milestoneId: 'ms-1011',
    taskId: 'tsk-10112',
    wbsNumber: '1.1.1.2.1',
    workDescription: 'Thermo-Mechanically Treated (TMT) Rebar Cage Supply',
    supplierName: 'Tata Steel Rebar Solutions Ltd',
    bpCode: 'BP-50201',
    targetDate: '2026-03-25',
    poNumber: 'PO-2026-0211',
    poValueGst: 4500000, // ₹ 45.00 L
    paidDate: '2026-04-12',
    status: 'Paid'
  },
  {
    id: 'sw-101122',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    milestoneId: 'ms-1011',
    taskId: 'tsk-10112',
    wbsNumber: '1.1.1.2.2',
    workDescription: 'Ready-Mix Concrete M35 Grade Pumping (1,850 cum)',
    supplierName: 'UltraTech Concrete ReadyMix Solutions',
    bpCode: 'BP-50204',
    targetDate: '2026-04-05',
    poNumber: 'PO-2026-0219',
    poValueGst: 7850000, // ₹ 78.50 L
    paidDate: '',
    status: 'Billed'
  },
  // Under Task 1.1.2.1
  {
    id: 'sw-101211',
    projectId: 'proj-001',
    sectionId: 'sec-101',
    milestoneId: 'ms-1012',
    taskId: 'tsk-10121',
    wbsNumber: '1.1.2.1.1',
    workDescription: 'Pre-applied Fully Bonded HDPE Waterproofing Membrane',
    supplierName: 'Fosroc Chemicals India Pvt Ltd',
    bpCode: 'BP-30419',
    targetDate: '2026-05-20',
    poNumber: 'PO-2026-0245',
    poValueGst: 3200000, // ₹ 32.00 L
    paidDate: '',
    status: 'In Execution'
  },
  // Under Task 1.2.1.1
  {
    id: 'sw-102111',
    projectId: 'proj-001',
    sectionId: 'sec-102',
    milestoneId: 'ms-1021',
    taskId: 'tsk-10211',
    wbsNumber: '1.2.1.1.1',
    workDescription: 'High-Tensile Fabricated Built-up Steel Portal Columns',
    supplierName: 'Kirby Building Systems India Pvt Ltd',
    bpCode: 'BP-10982',
    targetDate: '2026-08-10',
    poNumber: 'PO-2026-0310',
    poValueGst: 28500000, // ₹ 2.85 Cr
    paidDate: '',
    status: 'In Execution'
  },
  // Under Task 1.3.1.1
  {
    id: 'sw-103111',
    projectId: 'proj-001',
    sectionId: 'sec-103',
    milestoneId: 'ms-1031',
    taskId: 'tsk-10311',
    wbsNumber: '1.3.1.1.1',
    workDescription: 'Modular Cross-Belt Sorter System with Linear Synchronous Motors',
    supplierName: 'Vanderlande Logistics Systems India',
    bpCode: 'BP-88201',
    targetDate: '2026-12-10',
    poNumber: 'PO-2026-0440',
    poValueGst: 42000000, // ₹ 4.20 Cr
    paidDate: '',
    status: 'PO Issued'
  },
  // Project 2 Subwork
  {
    id: 'sw-201111',
    projectId: 'proj-002',
    sectionId: 'sec-201',
    milestoneId: 'ms-2011',
    taskId: 'tsk-20111',
    wbsNumber: '2.1.1.1.1',
    workDescription: 'Dual-Stage Semi-Hermetic Screw Compressor Skid',
    supplierName: 'Blue Star Industrial Refrigeration',
    bpCode: 'BP-77402',
    targetDate: '2026-07-15',
    poNumber: 'PO-2026-0511',
    poValueGst: 24500000, // ₹ 2.45 Cr
    paidDate: '',
    status: 'In Execution'
  },
  {
    id: 'sw-201112',
    projectId: 'proj-002',
    sectionId: 'sec-201',
    milestoneId: 'ms-2011',
    taskId: 'tsk-20111',
    wbsNumber: '2.1.1.1.2',
    workDescription: 'PIR High-Density Cold Room Panels with Camlocks',
    supplierName: 'Kingspan Jindal India',
    bpCode: 'BP-77419',
    targetDate: '2026-06-25',
    poNumber: 'PO-2026-0518',
    poValueGst: 24000000, // ₹ 2.40 Cr
    paidDate: '2026-05-10',
    status: 'Paid'
  },
  // Project 3 Subwork
  {
    id: 'sw-301111',
    projectId: 'proj-003',
    sectionId: 'sec-301',
    milestoneId: 'ms-3011',
    taskId: 'tsk-30111',
    wbsNumber: '3.1.1.1.1',
    workDescription: 'Double-Skin Hygienic Air Handling Units with Fan Arrays',
    supplierName: 'Voltas Industrial HVAC Solutions',
    bpCode: 'BP-66014',
    targetDate: '2026-09-15',
    poNumber: 'PO-2026-0689',
    poValueGst: 36000000, // ₹ 3.60 Cr
    paidDate: '2026-04-18',
    status: 'Paid'
  }
]

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'tm-001',
    name: 'Rajesh K. Verma',
    role: 'Principal Project Director',
    email: 'rajesh.verma@apexcap.corp',
    phone: '+91 98201 44521',
    projectId: 'proj-001',
    workItems: ['1.1 Civil Foundations', '1.2 PEB Superstructure'],
    status: 'Active'
  },
  {
    id: 'tm-002',
    name: 'Priya Sundaram',
    role: 'Chief Structural Engineer',
    email: 'priya.s@apexcap.corp',
    phone: '+91 98402 77112',
    projectId: 'proj-001',
    workItems: ['1.1.1 Bored Piling', '1.1.2 Raft Casting'],
    status: 'Active'
  },
  {
    id: 'tm-003',
    name: 'Arunav Sengupta',
    role: 'Senior Automation Lead',
    email: 'arunav.s@apexcap.corp',
    phone: '+91 98310 99482',
    projectId: 'proj-001',
    workItems: ['1.3 Sorter Systems'],
    status: 'Active'
  },
  {
    id: 'tm-004',
    name: 'Kavita Deshmukh',
    role: 'Procurement & Contracts Lead',
    email: 'kavita.d@apexcap.corp',
    phone: '+91 98901 22345',
    projectId: 'proj-002',
    workItems: ['2.1 Refrigeration Infrastructure'],
    status: 'Active'
  },
  {
    id: 'tm-005',
    name: 'Sunil Nair',
    role: 'Site Safety & Quality Manager',
    email: 'sunil.nair@apexcap.corp',
    phone: '+91 98450 11203',
    projectId: 'proj-003',
    workItems: ['3.1 Modular Cleanrooms'],
    status: 'On Leave'
  }
]

export const INITIAL_DPR: DprRecord[] = [
  {
    id: 'dpr-001',
    reportDate: '2026-10-14',
    projectId: 'proj-001',
    taskId: 'tsk-10121',
    dailyProgress: 4,
    workDoneToday: 'Completed HDPE membrane overlaps on Bay 4 and 5 with hot-wedge welding. Completed spark testing on 480 sqm.',
    manpowerCount: 38,
    equipmentDeployed: '2 Hot-wedge welders, 1 Extrusion welder, 1 Spark tester, 1 Mobile generator 25kVA',
    hindrances: 'Heavy morning drizzle delayed initial surface drying by 2 hours.',
    submittedBy: 'Sunil Nair (Site Safety & Quality)',
    status: 'Approved'
  },
  {
    id: 'dpr-002',
    reportDate: '2026-10-13',
    projectId: 'proj-001',
    taskId: 'tsk-10211',
    dailyProgress: 3,
    workDoneToday: 'Received 4 consignments of high-tensile steel portal columns from Kirby facility. Performed ultrasonic flaw testing on welds.',
    manpowerCount: 24,
    equipmentDeployed: '50-Ton Mobile Hydraulic Crane, 2 Forklifts, Ultrasonic Flaw Detector',
    hindrances: 'Traffic restriction on outer ring road delayed heavy transport by 3 hours.',
    submittedBy: 'Priya Sundaram (Chief Structural)',
    status: 'Verified'
  },
  {
    id: 'dpr-003',
    reportDate: '2026-10-12',
    projectId: 'proj-002',
    taskId: 'tsk-20111',
    dailyProgress: 5,
    workDoneToday: 'Aligned screw compressor baseplates with laser leveling equipment. Torqued anchor bolts to 450 Nm specification.',
    manpowerCount: 16,
    equipmentDeployed: 'Laser alignment kit, Digital torque wrenches, Gantry hoist',
    hindrances: 'None reported.',
    submittedBy: 'Kavita Deshmukh',
    status: 'Approved'
  }
]

export const INITIAL_DOCUMENTS: ProjectDocument[] = [
  {
    id: 'doc-001',
    name: 'CAPEX Board Sanction Note & Financial Allocation.pdf',
    projectId: 'proj-001',
    wbsType: 'Project',
    category: 'Approval Note',
    fileSize: '4.8 MB',
    fileType: 'PDF',
    uploadDate: '2026-01-16',
    uploadedBy: 'Rajesh K. Verma',
    status: 'Approved'
  },
  {
    id: 'doc-002',
    name: 'Tata Steel Rebar Supply Agreement - Master PO Copy.pdf',
    projectId: 'proj-001',
    wbsRecordId: 'sw-101121',
    wbsType: 'Sub-work',
    category: 'PO Copy',
    fileSize: '2.1 MB',
    fileType: 'PDF',
    uploadDate: '2026-03-25',
    uploadedBy: 'Kavita Deshmukh',
    status: 'Approved'
  },
  {
    id: 'doc-003',
    name: 'Geotechnical Soil Stratum & Plate Load Test Report.xlsx',
    projectId: 'proj-001',
    wbsRecordId: 'tsk-10111',
    wbsType: 'Task',
    category: 'Inspection Report',
    fileSize: '8.4 MB',
    fileType: 'XLSX',
    uploadDate: '2026-02-18',
    uploadedBy: 'Priya Sundaram',
    status: 'Approved'
  },
  {
    id: 'doc-004',
    name: 'Kirby PEB General Arrangement & Superstructure GFC Drawing.dwg',
    projectId: 'proj-001',
    wbsRecordId: 'sec-102',
    wbsType: 'Section',
    category: 'Technical Drawing',
    fileSize: '34.2 MB',
    fileType: 'DWG',
    uploadDate: '2026-05-30',
    uploadedBy: 'Priya Sundaram',
    status: 'Approved'
  },
  {
    id: 'doc-005',
    name: 'UltraTech Concrete RA Bill No 03 (Certified).pdf',
    projectId: 'proj-001',
    wbsRecordId: 'sw-101122',
    wbsType: 'Sub-work',
    category: 'Invoice',
    fileSize: '1.9 MB',
    fileType: 'PDF',
    uploadDate: '2026-04-10',
    uploadedBy: 'Kavita Deshmukh',
    status: 'Under Review'
  }
]

export const INITIAL_ROLES: RoleDefinition[] = [
  {
    id: 'role-admin',
    name: 'System Administrator',
    description: 'Full unconstrained system authority across financial approvals, user provisioning, WBS creation and governance.',
    userCount: 2,
    isSystem: true,
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      planning: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      operation: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      finance: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      document: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      access: { view: true, create: true, edit: true, delete: true, export: true, approve: true }
    }
  },
  {
    id: 'role-pm',
    name: 'Project Director / Manager',
    description: 'Manages WBS structure, Gantt schedules, daily progress reports, and milestone delivery.',
    userCount: 4,
    isSystem: false,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false, export: true, approve: true },
      planning: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
      operation: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
      finance: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      document: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
      access: { view: false, create: false, edit: false, delete: false, export: false, approve: false }
    }
  },
  {
    id: 'role-finance',
    name: 'Financial Controller',
    description: 'Authority over CAPEX budgets, PO values, billing reconciliations, and financial variances.',
    userCount: 3,
    isSystem: false,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      planning: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      operation: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
      finance: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      document: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
      access: { view: false, create: false, edit: false, delete: false, export: false, approve: false }
    }
  },
  {
    id: 'role-site',
    name: 'Site Execution Engineer',
    description: 'Responsible for Daily Progress Reports (DPR), team attendance, and site hindrance logging.',
    userCount: 8,
    isSystem: false,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
      planning: { view: true, create: false, edit: false, delete: false, export: false, approve: false },
      operation: { view: true, create: true, edit: true, delete: false, export: false, approve: false },
      finance: { view: false, create: false, edit: false, delete: false, export: false, approve: false },
      document: { view: true, create: true, edit: false, delete: false, export: false, approve: false },
      access: { view: false, create: false, edit: false, delete: false, export: false, approve: false }
    }
  },
  {
    id: 'role-auditor',
    name: 'Internal Compliance Auditor',
    description: 'Read-only access across all corporate modules and export authorization for audit trails.',
    userCount: 2,
    isSystem: false,
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      planning: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      operation: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      finance: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      document: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      access: { view: true, create: false, edit: false, delete: false, export: true, approve: false }
    }
  }
]

export const INITIAL_USER_PERMISSIONS: UserPermission[] = [
  {
    userId: 'usr-001',
    userName: 'Rajesh K. Verma',
    userEmail: 'rajesh.verma@apexcap.corp',
    password: 'Admin@2026#Secure',
    role: 'Admin',
    department: 'Corporate Infrastructure & Strategy',
    avatar: 'RV',
    status: 'Active',
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      planning: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      operation: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      finance: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      document: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      access: { view: true, create: true, edit: true, delete: true, export: true, approve: true }
    }
  },
  {
    userId: 'usr-002',
    userName: 'Priya Sundaram',
    userEmail: 'priya.s@apexcap.corp',
    password: 'Priya@Capex2026',
    role: 'CAPEX Admin',
    department: 'Civil & Structural Engineering',
    avatar: 'PS',
    status: 'Active',
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      planning: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      operation: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
      finance: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      document: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
      access: { view: true, create: false, edit: false, delete: false, export: false, approve: false }
    }
  },
  {
    userId: 'usr-003',
    userName: 'Arunav Sengupta',
    userEmail: 'arunav.s@apexcap.corp',
    password: 'Arunav@Fin2026',
    role: 'CAPEX Admin',
    department: 'Treasury & Capex Accounting',
    avatar: 'AS',
    status: 'Active',
    permissions: {
      dashboard: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      planning: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      operation: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
      finance: { view: true, create: true, edit: true, delete: true, export: true, approve: true },
      document: { view: true, create: true, edit: true, delete: false, export: true, approve: true },
      access: { view: true, create: false, edit: false, delete: false, export: false, approve: false }
    }
  },
  {
    userId: 'usr-004',
    userName: 'Kavita Deshmukh',
    userEmail: 'kavita.d@apexcap.corp',
    password: 'Kavita@View2026',
    role: 'Viewer',
    department: 'Site Execution & Field QA',
    avatar: 'KD',
    status: 'Active',
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      planning: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      operation: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      finance: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      document: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      access: { view: false, create: false, edit: false, delete: false, export: false, approve: false }
    }
  },
  {
    userId: 'usr-005',
    userName: 'Sunil Nair',
    userEmail: 'sunil.nair@apexcap.corp',
    password: 'Sunil@Audit2026',
    role: 'Viewer',
    department: 'Statutory & Risk Audit',
    avatar: 'SN',
    status: 'Active',
    permissions: {
      dashboard: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      planning: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      operation: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      finance: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      document: { view: true, create: false, edit: false, delete: false, export: true, approve: false },
      access: { view: false, create: false, edit: false, delete: false, export: false, approve: false }
    }
  }
]
