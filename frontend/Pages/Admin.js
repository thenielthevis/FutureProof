import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView, Animated, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTotalUsers, getUserRegistrationsByDate, getAllUsers, getDailyUserRegistrations } from '../API/user_api';
import { readAssets } from '../API/assets_api';
import { readAvatars } from '../API/avatar_api';
import { getMeditationBreathingExercises } from '../API/meditation_api';
import { getPhysicalActivities } from '../API/physical_activities_api';
import { readQuotes } from '../API/quotes_api';
import { getAllTaskCompletions } from '../API/task_completion_api';
import { getMostPredictedDisease, getTopPredictedDiseases } from '../API/prediction_api';
import { PieChart, LineChart, BarChart, ProgressChart, ContributionGraph, StackedBarChart } from 'react-native-chart-kit';
import Sidebar from './Sidebar';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Chart from 'chart.js/auto';

const Admin = () => {
  const navigation = useNavigation();
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalAvatars: 0,
    totalMeditationExercises: 0,
    totalPhysicalActivities: 0,
    totalQuotes: 0,
    mostPredictedDiseases: [],
    totalTaskCompletions: 0,
    assetsByType: {},
    weeklyRegistrations: Array(7).fill(0),
    monthlyRegistrations: Array(12).fill(0),
    topPredictedDiseases: [],
    taskCompletionsByType: {},
    activeUsers: 0,
    disabledUsers: 0,
    dailyRegistrations: Array(365).fill(0),
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerAnimation] = useState(new Animated.Value(0));

  // Refs for chart components
  const dailyRegistrationsChartRef = useRef(null);
  const assetsByTypeChartRef = useRef(null);
  const monthlyRegistrationsChartRef = useRef(null);
  const topPredictedDiseasesChartRef = useRef(null);
  const taskCompletionsByTypeChartRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const totalUsers = await getTotalUsers(token);
        const assets = await readAssets();
        const totalAssets = assets.length;
        const assetsByType = assets.reduce((acc, asset) => {
          acc[asset.asset_type] = (acc[asset.asset_type] || 0) + 1;
          return acc;
        }, {});
        const avatars = await readAvatars();
        const totalAvatars = avatars.length;
        const meditationExercises = await getMeditationBreathingExercises();
        const totalMeditationExercises = meditationExercises.length;
        const physicalActivities = await getPhysicalActivities();
        const totalPhysicalActivities = physicalActivities.length;
        const quotes = await readQuotes();
        const totalQuotes = quotes.length;
        const taskCompletions = await getAllTaskCompletions();
        const totalTaskCompletions = taskCompletions.length;

        const taskCompletionsByType = taskCompletions.reduce((acc, task) => {
          acc[task.task_type] = (acc[task.task_type] || 0) + 1;
          return acc;
        }, {});

        const users = await getAllUsers(token);
        const activeUsers = users.filter(user => !user.disabled).length;
        const disabledUsers = users.filter(user => user.disabled).length;

        const mostPredictedDisease = await getMostPredictedDisease(token);
        const topPredictedDiseases = await getTopPredictedDiseases(token);
        const registrations = await getUserRegistrationsByDate(token);
        const dailyRegistrations = await getDailyUserRegistrations(token);

        setDashboardData((prevData) => ({
          ...prevData,
          totalUsers,
          totalAssets,
          totalAvatars,
          totalMeditationExercises,
          totalPhysicalActivities,
          totalQuotes,
          totalTaskCompletions,
          mostPredictedDisease,
          assetsByType,
          weeklyRegistrations: registrations.weekly_registrations,
          monthlyRegistrations: registrations.monthly_registrations,
          topPredictedDiseases,
          taskCompletionsByType,
          activeUsers,
          disabledUsers,
          dailyRegistrations: dailyRegistrations.daily_registrations,
        }));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();

    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const getCardIcon = (title) => {
    switch (title) {
      case 'Total Assets': return <FontAwesome5 name="boxes" size={24} color="#10B981" />;
      case 'Total Users': return <FontAwesome5 name="users" size={24} color="#10B981" />;
      case 'Total Avatars': return <FontAwesome5 name="user-astronaut" size={24} color="#10B981" />;
      case 'Total Meditation Exercises': return <FontAwesome5 name="spa" size={24} color="#10B981" />;
      case 'Total Physical Activities': return <FontAwesome5 name="running" size={24} color="#10B981" />;
      case 'Total Quotes': return <FontAwesome5 name="quote-right" size={24} color="#10B981" />;
      case 'Total Task Completions': return <FontAwesome5 name="tasks" size={24} color="#10B981" />;
      case 'Most Predicted Disease': return <FontAwesome5 name="heartbeat" size={24} color="#10B981" />;
      default: return <FontAwesome5 name="chart-bar" size={24} color="#10B981" />;
    }
  };

  const dashboardCards = [
    { title: 'Total Assets', value: dashboardData.totalAssets },
    { title: 'Total Users', value: dashboardData.totalUsers },
    { title: 'Total Avatars', value: dashboardData.totalAvatars },
    { title: 'Total Meditation Exercises', value: dashboardData.totalMeditationExercises },
    { title: 'Total Physical Activities', value: dashboardData.totalPhysicalActivities },
    { title: 'Total Quotes', value: dashboardData.totalQuotes },
    { title: 'Total Task Completions', value: dashboardData.totalTaskCompletions },
    { title: 'Most Predicted Disease', value: dashboardData.mostPredictedDisease },
  ];

  const chartColors = [
    '#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#34D399', '#6EE7B7', '#A7F3D0',
    '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#84cc16', '#65a30d', '#4d7c0f',
  ];

  const assetChartData = Object.keys(dashboardData.assetsByType).map((key, index) => ({
    name: key,
    population: dashboardData.assetsByType[key],
    color: chartColors[index % chartColors.length],
    legendFontColor: '#555',
    legendFontSize: 12,
  }));

  const diseaseChartData = dashboardData.topPredictedDiseases.map((disease, index) => ({
    name: disease.condition,
    population: disease.count,
    color: chartColors[index % chartColors.length],
    legendFontColor: '#555',
    legendFontSize: 12,
  }));

  const taskCompletionChartData = Object.keys(dashboardData.taskCompletionsByType).map((key, index) => ({
    name: key,
    population: dashboardData.taskCompletionsByType[key],
    color: chartColors[index % chartColors.length],
    legendFontColor: '#555',
    legendFontSize: 12,
  }));

  const userStatusData = {
    labels: ['Active', 'Disabled'],
    datasets: [
      {
        data: [dashboardData.activeUsers, dashboardData.disabledUsers],
        colors: [
          (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
          (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
        ]
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#10B981"
    }
  };

  const barChartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    barPercentage: 0.6,
    decimalPlaces: 0,
    color: (opacity = 1, index) => {
      return index === 0 ? `rgba(22, 163, 74, ${opacity})` : `rgba(220, 38, 38, ${opacity})`;
    },
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const convertImageToBase64 = async (uri) => {
    try {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        return `data:image/png;base64,${base64}`;
      }
    } catch (error) {
      console.error('Error converting image:', error);
      return null;
    }
  };

  const convertChartToBase64 = async (chartRef) => {
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current);
      return canvas.toDataURL('image/png');
    }
    return null;
  };

  const handleExportPDF = async () => {
    try {
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");

      const summaryHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
            <div style="flex: 1; text-align: center; margin-top: 15px;">
              <h1 style="font-size: 18px; margin: 0;">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
              <br>
              <h2 style="font-size: 16px; margin: 0;">Admin Dashboard Report</h2>
              <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
            </div>
            <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
          </div>
          <div style="margin-top: 20px;">
            <h3>Our Mission</h3>
            <p>FutureProof empowers individuals with AI-driven, gamified health insights for proactive well-being. By integrating genetic, lifestyle, and environmental data, we deliver personalized, preventive care solutions.</p>
            <h3>Our Vision</h3>
            <p>We envision a future where predictive healthcare transforms lives, making well-being accessible, engaging, and proactive through AI and gamification.</p>
          </div>
          <div style="margin-top: 20px;">
            <h3>Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              ${dashboardCards.map(card => `
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">${card.title}</th>
                  <td style="padding: 12px; border: 1px solid #ddd;">${typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </div>
      `;

      const chartsHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="width: 48%; text-align: center;">
              <h3>Daily User Registrations</h3>
              <img src="${await convertChartToBase64(dailyRegistrationsChartRef)}" alt="Daily User Registrations" style="width: 100%; height: auto;">
            </div>
            <div style="width: 48%; text-align: center;">
              <h3>Assets by Type</h3>
              <img src="${await convertChartToBase64(assetsByTypeChartRef)}" alt="Assets by Type" style="width: 100%; height: auto;">
            </div>
          </div>
          <div style="page-break-after: always;"></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="width: 48%; text-align: center;">
              <h3>Monthly User Registrations</h3>
              <img src="${await convertChartToBase64(monthlyRegistrationsChartRef)}" alt="Monthly User Registrations" style="width: 100%; height: auto;">
            </div>
            <div style="width: 48%; text-align: center;">
              <h3>Top 5 Predicted Diseases</h3>
              <img src="${await convertChartToBase64(topPredictedDiseasesChartRef)}" alt="Top 5 Predicted Diseases" style="width: 100%; height: auto;">
            </div>
          </div>
          <div style="page-break-after: always;"></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="width: 48%; text-align: center;">
              <h3>Task Completions by Type</h3>
              <img src="${await convertChartToBase64(taskCompletionsByTypeChartRef)}" alt="Task Completions by Type" style="width: 100%; height: auto;">
            </div>
          </div>
        </div>
      `;

      if (Platform.OS === 'web') {
        const summaryContainer = document.createElement('div');
        summaryContainer.style.position = 'absolute';
        summaryContainer.style.left = '-9999px';
        summaryContainer.innerHTML = summaryHtml;
        document.body.appendChild(summaryContainer);

        const chartsContainer = document.createElement('div');
        chartsContainer.style.position = 'absolute';
        chartsContainer.style.left = '-9999px';
        chartsContainer.innerHTML = chartsHtml;
        document.body.appendChild(chartsContainer);

        const waitForImages = () => {
          const images = [...summaryContainer.getElementsByTagName('img'), ...chartsContainer.getElementsByTagName('img')];
          return Promise.all(
            images.map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
              });
            })
          );
        };

        try {
          await waitForImages();

          const pdf = new jsPDF('p', 'pt', 'a4');

          const summaryCanvas = await html2canvas(summaryContainer);
          const summaryImgData = summaryCanvas.toDataURL('image/png');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const summaryPdfHeight = (summaryCanvas.height * pdfWidth) / summaryCanvas.width;
          pdf.addImage(summaryImgData, 'PNG', 0, 0, pdfWidth, summaryPdfHeight);

          const chartsCanvas = await html2canvas(chartsContainer);
          const chartsImgData = chartsCanvas.toDataURL('image/png');
          const chartsPdfHeight = (chartsCanvas.height * pdfWidth) / chartsCanvas.width;

          let currentHeight = 0;
          while (currentHeight < chartsCanvas.height) {
            pdf.addPage();
            pdf.addImage(chartsImgData, 'PNG', 0, -currentHeight, pdfWidth, chartsPdfHeight);
            currentHeight += pdf.internal.pageSize.getHeight();
          }

          pdf.save('admin-dashboard-report.pdf');

        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        } finally {
          document.body.removeChild(summaryContainer);
          document.body.removeChild(chartsContainer);
        }
      } else {
        try {
          const { uri } = await Print.printToFileAsync({ html: summaryHtml + chartsHtml });
          await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
          console.error('Error generating PDF:', error);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in handleExportPDF:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Sidebar />
      <View style={styles.mainContent}>
        <ScrollView style={styles.content}>
          <View style={styles.dashboard}>
            <Text style={styles.pageTitle}>Admin Dashboard</Text>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
              <Text style={styles.exportButtonText}>Export PDF</Text>
            </TouchableOpacity>
            <View style={styles.cardsContainer}>
              <FlatList
                data={dashboardCards}
                numColumns={4}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.dashboardCard}>
                    <View style={styles.cardIconContainer}>
                      {getCardIcon(item.title)}
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.dashboardCardValue}>
                        {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                      </Text>
                      <Text style={styles.dashboardCardTitle}>{item.title}</Text>
                    </View>
                  </View>
                )}
              />
            </View>
            <View style={styles.chartGrid}>
              <View style={styles.chartContainer} ref={dailyRegistrationsChartRef}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Daily User Registrations</Text>
                </View>
                <ContributionGraph
                  values={dashboardData.dailyRegistrations.map((count, index) => ({
                    date: new Date(new Date().getFullYear(), 0, index + 1).toISOString().split('T')[0],
                    count,
                  }))}
                  endDate={new Date(new Date().getFullYear(), 11, 31)}
                  numDays={365}
                  width={450}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              </View>
              <View style={styles.chartContainer} ref={assetsByTypeChartRef}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Assets by Type</Text>
                </View>
                <BarChart
                  data={{
                    labels: Object.keys(dashboardData.assetsByType),
                    datasets: [
                      {
                        data: Object.values(dashboardData.assetsByType),
                      },
                    ],
                  }}
                  width={450}
                  height={220}
                  chartConfig={barChartConfig}
                  style={styles.chart}
                  verticalLabelRotation={0}
                  fromZero={true}
                  showValuesOnTopOfBars={true}
                />
              </View>
              <View style={styles.chartContainer} ref={monthlyRegistrationsChartRef}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Monthly User Registrations</Text>
                </View>
                <LineChart
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [
                      {
                        data: dashboardData.monthlyRegistrations,
                        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                        strokeWidth: 2
                      },
                    ],
                  }}
                  width={450}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </View>
              <View style={styles.chartContainer} ref={topPredictedDiseasesChartRef}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Top 5 Predicted Diseases</Text>
                </View>
                <PieChart
                  data={diseaseChartData}
                  width={450}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              </View>
              <View style={styles.chartContainer} ref={taskCompletionsByTypeChartRef}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>Task Completions by Type</Text>
                </View>
                <ProgressChart
                  data={{
                    labels: Object.keys(dashboardData.taskCompletionsByType).slice(0, 4),
                    data: Object.values(dashboardData.taskCompletionsByType)
                      .slice(0, 4)
                      .map(value => value / Math.max(...Object.values(dashboardData.taskCompletionsByType)))
                  }}
                  width={450}
                  height={220}
                  strokeWidth={16}
                  radius={32}
                  chartConfig={{
                    ...chartConfig,
                    backgroundGradientFromOpacity: 0,
                    backgroundGradientToOpacity: 0,
                  }}
                  hideLegend={false}
                  style={styles.chart}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fc',
  },
  sidebar: {
    width: 240,
    height: '100%',
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  sidebarCollapsed: {
    width: 60,
  },
  sidebarTop: {
    alignItems: 'center',
    marginBottom: 25,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    width: '100%',
  },
  sidebarBrand: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  collapseButton: {
    position: 'absolute',
    right: 5,
  },
  sidebarLogoCollapsed: {
    marginTop: 10,
    marginBottom: 20,
  },
  sidebarContent: {
    flex: 1,
  },
  menuGroup: {
    marginBottom: 22,
  },
  menuLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    paddingHorizontal: 20,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 20,
    marginBottom: 1,
  },
  sidebarIconOnly: {
    alignItems: 'center',
    paddingVertical: 12,
    width: 60,
    marginBottom: 1,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  sidebarText: {
    color: 'white',
    fontSize: 13,
    marginLeft: 10,
  },
  collapsedMenuItems: {
    alignItems: 'center',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 15,
    paddingHorizontal: 20,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpText: {
    color: 'white',
    fontSize: 13,
    marginLeft: 10,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  content: {
    flex: 1,
    padding: 25,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 25,
  },
  dashboard: {
  },
  cardsContainer: {
    marginBottom: 25,
  },
  dashboardCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    margin: 10,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: '22%',
    maxWidth: '23%',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  dashboardCardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  dashboardCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chartContainer: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartActions: {
    flexDirection: 'row',
  },
  chartAction: {
    padding: 5,
    marginLeft: 5,
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  exportButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  exportButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default Admin;