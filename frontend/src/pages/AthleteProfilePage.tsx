import React, { useEffect, useState, FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    User,
    GraduationCap,
    Dumbbell,
    Shirt,
    TrendingUp,
    Trophy,
    Zap,
    Trash,
} from "lucide-react";
import { athleteAPI, performanceAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
    Athlete,
    PerformanceRecord,
    PerformanceUnit,
    SessionType,
} from "../types";
import "./AthleteProfilePage.css";

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

interface PerfForm {
    month: string;
    week: string;
    eventName: string;
    result: string;
    unit: PerformanceUnit;
    sessionType: SessionType;
    isPersonalBest: boolean;
    isSeasonBest: boolean;
}

const INITIAL_PERF: PerfForm = {
    month: "",
    week: "",
    eventName: "",
    result: "",
    unit: PerformanceUnit.Seconds,
    sessionType: SessionType.Training,
    isPersonalBest: false,
    isSeasonBest: false,
};

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
}

const DetailRow = ({ label, value }: DetailRowProps) => (
    <div className="detail-row">
        <span className="detail-label">{label}</span>
        <span className="detail-value">{value}</span>
    </div>
);

export default function AthleteProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdmin, isCoach } = useAuth();

    const [athlete, setAthlete] = useState<Athlete | null>(null);
    const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
    const [activeTab, setActiveTab] = useState<"personal" | "performance">(
        "personal",
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [perfForm, setPerfForm] = useState<PerfForm>(INITIAL_PERF);
    const [perfLoading, setPerfLoading] = useState(false);
    const [perfError, setPerfError] = useState("");

    useEffect(() => {
        if (!id) return;
        Promise.all([athleteAPI.getOne(id), performanceAPI.getByAthlete(id)])
            .then(([aRes, pRes]) => {
                setAthlete(aRes.data.data);
                setPerformance(pRes.data.data);
            })
            .catch(() => setError("Failed to load athlete data."))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDeleteAthlete = async () => {
        if (!athlete || !window.confirm(`Permanently remove ${athlete.name}?`))
            return;
        try {
            await athleteAPI.delete(id!);
            navigate("/athletes");
        } catch {
            alert("Failed to delete athlete.");
        }
    };

    const handleAddPerformance = async (e: FormEvent) => {
        e.preventDefault();
        setPerfLoading(true);
        setPerfError("");
        try {
            await performanceAPI.add({ ...perfForm, athlete: id });
            const { data } = await performanceAPI.getByAthlete(id!);
            setPerformance(data.data);
            setPerfForm(INITIAL_PERF);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;
            setPerfError(msg || "Failed to add performance record.");
        } finally {
            setPerfLoading(false);
        }
    };

    const handleDeletePerformance = async (recordId: string) => {
        if (!window.confirm("Delete this performance record?")) return;
        try {
            await performanceAPI.delete(recordId);
            setPerformance((prev) => prev.filter((r) => r._id !== recordId));
        } catch {
            alert("Failed to delete record.");
        }
    };

    if (loading)
        return (
            <div className="loading-screen" style={{ height: "60vh" }}>
                <div className="spinner" />
            </div>
        );
    if (error || !athlete)
        return (
            <div className="alert alert-error">
                {error || "Athlete not found."}
            </div>
        );

    return (
        <div className="profile-page">
            {/* ── Header ── */}
            <div className="profile-header">
                <button
                    onClick={() => navigate("/athletes")}
                    className="btn btn-secondary btn-sm"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <ArrowLeft size={14} /> Back
                </button>
                <div className="profile-header-actions">
                    {(isAdmin || isCoach) && (
                        <Link
                            to={`/athletes/${id}/edit`}
                            className="btn btn-secondary btn-sm"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            <Pencil size={14} /> Edit
                        </Link>
                    )}
                    {isAdmin && (
                        <button
                            className="btn btn-danger btn-sm"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                            onClick={handleDeleteAthlete}
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    )}
                </div>
            </div>

            {/* ── Hero ── */}
            <div className="card profile-hero">
                <div className="hero-avatar">
                    {athlete.name?.[0]?.toUpperCase()}
                </div>
                <div className="hero-info">
                    <h2 className="hero-name">{athlete.name}</h2>
                    <div className="hero-meta">
                        <span>Age {athlete.age ?? "—"}</span>
                        <span>{athlete.gender}</span>
                        {athlete.eventCategory && (
                            <span>{athlete.eventCategory}</span>
                        )}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "8px",
                        }}
                    >
                        <span
                            className={`badge badge-${athlete.paymentStatus?.toLowerCase()}`}
                        >
                            {athlete.paymentStatus}
                        </span>
                        {athlete.events?.map((ev, i) => (
                            <span
                                key={i}
                                className="badge"
                                style={{
                                    background: "var(--primary-light)",
                                    color: "var(--primary-dark)",
                                }}
                            >
                                {ev.eventName}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="profile-tabs">
                {(["personal", "performance"] as const).map((tab) => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        {tab === "personal" ? (
                            <>
                                <User size={15} /> Personal Details
                            </>
                        ) : (
                            <>
                                <TrendingUp size={15} /> Performance
                            </>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Personal Tab ── */}
            {activeTab === "personal" && (
                <div className="details-grid">
                    <div className="card details-card">
                        <h3
                            className="card-title"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <User size={16} /> Personal Information
                        </h3>
                        <DetailRow
                            label="Date of Birth"
                            value={
                                athlete.dateOfBirth
                                    ? new Date(
                                          athlete.dateOfBirth,
                                      ).toLocaleDateString("en-IN")
                                    : "—"
                            }
                        />
                        <DetailRow
                            label="Mobile Number"
                            value={athlete.mobileNumber}
                        />
                        <DetailRow label="Email" value={athlete.email || "—"} />
                        <DetailRow
                            label="Address"
                            value={athlete.address || "—"}
                        />
                        <DetailRow
                            label="Father's Name"
                            value={athlete.fatherName || "—"}
                        />
                        <DetailRow
                            label="Mother's Name"
                            value={athlete.motherName || "—"}
                        />
                    </div>

                    <div className="card details-card">
                        <h3
                            className="card-title"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <GraduationCap size={16} /> Academic &amp; ID Info
                        </h3>
                        <DetailRow
                            label="Student Status"
                            value={athlete.studentStatus || "—"}
                        />
                        <DetailRow
                            label="School / College"
                            value={athlete.schoolCollegeName || "—"}
                        />
                        <DetailRow
                            label="Aadhar Number"
                            value={athlete.aadharNumber || "—"}
                        />
                        <DetailRow
                            label="EMIS / UMIS No."
                            value={athlete.emisNumber || "—"}
                        />
                        <DetailRow
                            label="TNAA / AFI ID"
                            value={athlete.tnaaAfiId || "—"}
                        />
                    </div>

                    <div className="card details-card">
                        <h3
                            className="card-title"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <Dumbbell size={16} /> Physical &amp; Sport
                        </h3>
                        <DetailRow
                            label="Height"
                            value={
                                athlete.height ? `${athlete.height} cm` : "—"
                            }
                        />
                        <DetailRow
                            label="Weight"
                            value={
                                athlete.weight ? `${athlete.weight} kg` : "—"
                            }
                        />
                        <DetailRow
                            label="Event Category"
                            value={athlete.eventCategory || "—"}
                        />
                        {athlete.events?.map((ev, i) => (
                            <div key={i}>
                                <DetailRow
                                    label={`Event ${i + 1}`}
                                    value={ev.eventName}
                                />
                                <DetailRow
                                    label={`Personal Best ${i + 1}`}
                                    value={ev.personalBest || "—"}
                                />
                                <DetailRow
                                    label={`Seasonal Best ${i + 1}`}
                                    value={ev.seasonalBest || "—"}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="card details-card">
                        <h3
                            className="card-title"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <Shirt size={16} /> Kit Sizes &amp; Fees
                        </h3>
                        <DetailRow
                            label="T-Shirt Size"
                            value={
                                (
                                    athlete as unknown as {
                                        kitSizes?: { tshirt?: string };
                                    }
                                ).kitSizes?.tshirt || "—"
                            }
                        />
                        <DetailRow
                            label="Lower Size"
                            value={
                                (
                                    athlete as unknown as {
                                        kitSizes?: { lower?: string };
                                    }
                                ).kitSizes?.lower || "—"
                            }
                        />
                        <DetailRow
                            label="Sleeveless Size"
                            value={
                                (
                                    athlete as unknown as {
                                        kitSizes?: { sleeveless?: string };
                                    }
                                ).kitSizes?.sleeveless || "—"
                            }
                        />
                        <DetailRow
                            label="Fee Amount"
                            value={
                                athlete.feeAmount
                                    ? `₹${athlete.feeAmount}`
                                    : "—"
                            }
                        />
                        <DetailRow
                            label="Payment Status"
                            value={
                                <span
                                    className={`badge badge-${athlete.paymentStatus?.toLowerCase()}`}
                                >
                                    {athlete.paymentStatus}
                                </span>
                            }
                        />
                    </div>
                </div>
            )}

            {/* ── Performance Tab ── */}
            {activeTab === "performance" && (
                <div className="performance-section">
                    {/* Add record form */}
                    {(isAdmin || isCoach) && (
                        <div className="card perf-form-card">
                            <h3
                                className="card-title"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                <TrendingUp size={16} /> Log Performance
                            </h3>
                            {perfError && (
                                <div className="alert alert-error">
                                    {perfError}
                                </div>
                            )}
                            <form
                                onSubmit={handleAddPerformance}
                                className="perf-form"
                            >
                                <select
                                    className="form-control"
                                    value={perfForm.month}
                                    required
                                    onChange={(e) =>
                                        setPerfForm({
                                            ...perfForm,
                                            month: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Select Month</option>
                                    {MONTHS.map((m) => (
                                        <option key={m}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    className="form-control"
                                    value={perfForm.week}
                                    required
                                    onChange={(e) =>
                                        setPerfForm({
                                            ...perfForm,
                                            week: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">Select Week</option>
                                    {WEEKS.map((w) => (
                                        <option key={w}>{w}</option>
                                    ))}
                                </select>
                                <input
                                    className="form-control"
                                    placeholder="Event (e.g. 100m Sprint)"
                                    value={perfForm.eventName}
                                    required
                                    onChange={(e) =>
                                        setPerfForm({
                                            ...perfForm,
                                            eventName: e.target.value,
                                        })
                                    }
                                />
                                <input
                                    className="form-control"
                                    placeholder="Result (e.g. 12.5)"
                                    value={perfForm.result}
                                    required
                                    onChange={(e) =>
                                        setPerfForm({
                                            ...perfForm,
                                            result: e.target.value,
                                        })
                                    }
                                />
                                <select
                                    className="form-control"
                                    value={perfForm.unit}
                                    onChange={(e) =>
                                        setPerfForm({
                                            ...perfForm,
                                            unit: e.target
                                                .value as PerformanceUnit,
                                        })
                                    }
                                >
                                    {Object.values(PerformanceUnit).map((u) => (
                                        <option key={u} value={u}>
                                            {u}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="form-control"
                                    value={perfForm.sessionType}
                                    onChange={(e) =>
                                        setPerfForm({
                                            ...perfForm,
                                            sessionType: e.target
                                                .value as SessionType,
                                        })
                                    }
                                >
                                    {Object.values(SessionType).map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "16px",
                                        alignItems: "center",
                                    }}
                                >
                                    <label
                                        style={{
                                            display: "flex",
                                            gap: "6px",
                                            alignItems: "center",
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={perfForm.isPersonalBest}
                                            onChange={(e) =>
                                                setPerfForm({
                                                    ...perfForm,
                                                    isPersonalBest:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <Trophy size={14} color="#f59e0b" />{" "}
                                        Personal Best
                                    </label>
                                    <label
                                        style={{
                                            display: "flex",
                                            gap: "6px",
                                            alignItems: "center",
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={perfForm.isSeasonBest}
                                            onChange={(e) =>
                                                setPerfForm({
                                                    ...perfForm,
                                                    isSeasonBest:
                                                        e.target.checked,
                                                })
                                            }
                                        />
                                        <Zap size={14} color="#6366f1" /> Season
                                        Best
                                    </label>
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={perfLoading}
                                >
                                    {perfLoading ? "Saving..." : "+ Add Record"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Records table */}
                    <div className="card">
                        <h3 className="card-title">
                            Performance Records ({performance.length})
                        </h3>
                        {performance.length === 0 ? (
                            <p
                                style={{
                                    color: "var(--gray-400)",
                                    textAlign: "center",
                                    padding: "30px",
                                }}
                            >
                                No performance records yet.
                            </p>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Week</th>
                                            <th>Event</th>
                                            <th>Result</th>
                                            <th>Type</th>
                                            <th>Flags</th>
                                            <th>Date</th>
                                            {(isAdmin || isCoach) && (
                                                <th>Action</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performance.map((r) => (
                                            <tr key={r._id}>
                                                <td>{r.month}</td>
                                                <td>{r.week}</td>
                                                <td style={{ fontWeight: 600 }}>
                                                    {r.eventName}
                                                </td>
                                                <td
                                                    style={{
                                                        fontFamily:
                                                            "var(--font-mono)",
                                                        fontWeight: 700,
                                                        color: "var(--primary)",
                                                    }}
                                                >
                                                    {r.result}{" "}
                                                    {r.unit !== "other"
                                                        ? r.unit
                                                        : ""}
                                                </td>
                                                <td>
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            background:
                                                                "var(--gray-100)",
                                                            color: "var(--gray-600)",
                                                        }}
                                                    >
                                                        {r.sessionType}
                                                    </span>
                                                </td>
                                                <td>
                                                    {r.isPersonalBest && (
                                                        <span title="Personal Best">
                                                            <Trophy
                                                                size={14}
                                                                color="#f59e0b"
                                                            />
                                                        </span>
                                                    )}
                                                    {r.isSeasonBest && (
                                                        <span title="Season Best">
                                                            <Zap
                                                                size={14}
                                                                color="#6366f1"
                                                            />
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        fontSize: "0.82rem",
                                                        color: "var(--gray-500)",
                                                    }}
                                                >
                                                    {new Date(
                                                        r.date,
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                    )}
                                                </td>
                                                {(isAdmin || isCoach) && (
                                                    <td>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "4px",
                                                            }}
                                                            onClick={() =>
                                                                handleDeletePerformance(
                                                                    r._id,
                                                                )
                                                            }
                                                        >
                                                            <Trash size={13} />{" "}
                                                            Delete
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
