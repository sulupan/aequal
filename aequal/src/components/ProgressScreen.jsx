import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ProgressScreen = ({ userId, progress, isDataLoading }) => {
    
    // Prepare data for the chart
    const chartData = useMemo(() => {
        const last10 = progress.slice(0, 10).reverse(); // Last 10 results in chronological order
        
        return {
            labels: last10.map((item, index) => `${item.lessonTitle || 'Lesson ' + (index + 1)} (${item.mode === 'ears' ? 'E' : 'V'})`),
            datasets: [
                {
                    label: 'Score (out of 100)',
                    data: last10.map(item => Math.round(item.score * 100)),
                    backgroundColor: last10.map(item => item.mode === 'eyes' ? 'rgba(75, 192, 192, 0.8)' : 'rgba(153, 102, 255, 0.8)'),
                    borderColor: last10.map(item => item.mode === 'eyes' ? 'rgb(75, 192, 192)' : 'rgb(153, 102, 255)'),
                    borderWidth: 1,
                },
            ],
        };
    }, [progress]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { font: { size: 14 } }
            },
            title: {
                display: true,
                text: 'Your Progress: Last 10 Tests',
                font: { size: 18 }
            },
            tooltip: {
                titleFont: { size: 16 },
                bodyFont: { size: 14 }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'Score (%)', font: { size: 16 } },
                ticks: { font: { size: 14 } }
            },
            x: {
                ticks: { font: { size: 12 }, autoSkip: false, maxRotation: 45, minRotation: 45 }
            }
        }
    };

    if (isDataLoading) return <div className="text-center text-xl mt-8">Loading progress data...</div>;

    return (
        <div className="p-8 pt-20 max-w-6xl mx-auto">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-6 border-b pb-2">My Progress</h2>
            <p className="text-lg mb-8 text-gray-600">
                Here you can see your scores and track your achievements.
            </p>

            {progress.length === 0 ? (
                <div className="text-center p-10 bg-yellow-50 rounded-xl border border-yellow-200">
                    <p className="text-2xl font-bold text-yellow-800">No data to display.</p>
                    <p className="text-lg text-yellow-700 mt-2">Complete some lessons and tests to see your progress!</p>
                </div>
            ) : (
                <>
                    <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                        <Bar options={chartOptions} data={chartData} />
                    </div>

                    <h3 className="text-3xl font-bold text-gray-700 mb-4">Detailed Results</h3>
                    <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Score (%)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Comment</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {progress.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${item.mode === 'ears' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                {item.mode === 'ears' ? 'Ears' : 'Eyes'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.lessonTitle}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">{Math.round(item.score * 100)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={item.aiGradeComment}>{item.aiGradeComment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProgressScreen;