import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal, Alert, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { readAssessments } from '../API/daily_assessment_api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Toast from 'react-native-toast-message';
import Sidebar from './Sidebar';

const Assessments = () => {
  const navigation = useNavigation();
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const assessmentsData = await readAssessments();
        setAssessments(assessmentsData);
        setFilteredAssessments(assessmentsData);
      } catch (error) {
        console.error('Error fetching assessments:', error);
      }
    };
    fetchAssessments();
  }, []);

// Convert a local image to a Base64 string (or return remote URL)
  const convertImageToBase64 = async (uri) => {
    try {
      if (uri.startsWith('http://') || uri.startsWith('https://')) {
        // Fetch remote image and convert to base64
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // Convert local image to base64
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        return `data:image/png;base64,${base64}`;
      }
    } catch (error) {
      console.error('Error converting image:', error);
      return null;
    }
  };

  const handleExportPDF = async () => {
    try {
      // Convert logo URLs to base64
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");

      const htmlContent = filteredAssessments.map(assessment => `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
            <div style="flex: 1; text-align: center; margin-top: 15px;">
              <h1 style="font-size: 18px; margin: 0; ">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
              <h2 style="font-size: 16px; margin: 0; ">Embrace The Bear Within - Strong, Resilient, Future-Ready</h4>
              <br>
              <h2 style="font-size: 16px; margin: 0;">Daily Assessment Report</h2>
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
            <h3>User Information</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Username</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.username}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Age</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.age}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Gender</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.gender}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Height</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.height} cm</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Weight</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.weight} kg</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Environment</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.environment}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Vices</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.vices.join(', ')}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Genetic Diseases</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.genetic_diseases.join(', ')}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Lifestyle</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.lifestyle.join(', ')}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Food Intake</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.food_intake.join(', ')}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Sleep Hours</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.sleep_hours}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Activeness</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.activeness}</td>
              </tr>
            </table>
          </div>
          <div style="margin-top: 20px;">
            <h3>Prevention Progress</h3>
            <ul>
              ${assessment.updated_predictions.map(prediction => `
                <li>
                  <b>Condition: ${prediction.condition}</b><br>
                  <div style="display: flex; align-items: center;">
                    <div style="width: 100px; height: 10px; background-color: #ddd; margin-right: 10px;">
                      <div style="width: ${prediction.old_percentage}%; height: 100%; background-color: #3498db;"></div>
                    </div>
                    <span>${prediction.old_percentage}%</span>
                  </div>
                  <div style="display: flex; align-items: center; margin-top: 5px;">
                    <div style="width: 100px; height: 10px; background-color: #ddd; margin-right: 10px;">
                      <div style="width: ${prediction.new_percentage}%; height: 100%; background-color: #2ecc71;"></div>
                    </div>
                    <span>${prediction.new_percentage}%</span>
                  </div>
                  <p>Reason: ${prediction.reason}</p>
                </li>
              `).join('')}
            </ul>
          </div>
          <div style="margin-top: 20px;">
            <h3>Nutritional Analysis</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Question</th>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Answer</th>
                </tr>
              </thead>
              <tbody>
                ${assessment.nutritional_analysis.questions_answers.map(qa => `
                  <tr>
                    <td style="padding: 12px; border: 1px solid #ddd;">${qa.question}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${qa.answer}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 20px;">
            <h3>Recommendations</h3>
            <ul>
              ${assessment.recommendations.map(rec => `
                <li>${rec}</li>
              `).join('')}
            </ul>
          </div>
        </div>
      `).join('<div style="page-break-after: always;"></div>');

      if (Platform.OS === 'web') {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.innerHTML = htmlContent;
        document.body.appendChild(container);

        const waitForImages = () => {
          const images = container.getElementsByTagName('img');
          return Promise.all(
            Array.from(images).map((img) => {
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
          const canvas = await html2canvas(container);
          const imgData = canvas.toDataURL('image/png');

          const pdf = new jsPDF('p', 'pt', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

          // Add new pages if content exceeds one page
          let currentHeight = pdfHeight;
          while (currentHeight > pdf.internal.pageSize.getHeight()) {
            pdf.addPage();
            currentHeight -= pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, -currentHeight, pdfWidth, pdfHeight);
          }

        pdf.save('users-assessment-report.pdf');

        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        } finally {
          document.body.removeChild(container);
        }
      } else {
        try {
          const { uri } = await Print.printToFileAsync({ html: htmlContent });
          await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
          console.error('Error generating PDF:', error);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in handleExportUserPDF:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleExportUserPDF = async (assessment) => {
    try {
      // Convert logo URLs to base64
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
            <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
            <div style="flex: 1; text-align: center; margin-top: 15px;">
              <h1 style="font-size: 18px; margin: 0; ">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
              <br>
              <h2 style="font-size: 16px; margin: 0;">Daily Assessment Report</h2>
              <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
          </div>
            <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
          </div>
          <div style="margin-top: 10px;">
            <h3>Our Mission</h3>
            <p>FutureProof empowers individuals with AI-driven, gamified health insights for proactive well-being. By integrating genetic, lifestyle, and environmental data, we deliver personalized, preventive care solutions.</p>
            <h3>Our Vision</h3>
            <p>We envision a future where predictive healthcare transforms lives, making well-being accessible, engaging, and proactive through AI and gamification.</p>
          </div>
          <div style="margin-top: 10px;">
            <h3>User Information</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Username</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.username}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Age</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.age}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Gender</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.gender}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Height</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.height} cm</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Weight</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.weight} kg</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Environment</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.environment}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Vices</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.vices.join(', ')}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Genetic Diseases</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.genetic_diseases.join(', ')}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Lifestyle</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.lifestyle.join(', ')}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Food Intake</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.food_intake.join(', ')}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Sleep Hours</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.sleep_hours}</td>
              </tr>
              <tr>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Activeness</th>
                <td style="padding: 12px; border: 1px solid #ddd;">${assessment.activeness}</td>
              </tr>
            </table>
          </div>
          <div style="margin-top: 10px;">
            <h3>Prevention Progress</h3>
            <ul>
              ${assessment.updated_predictions.map(prediction => `
                <li>
                  <b>Condition: ${prediction.condition}</b><br>
                  <div style="display: flex; align-items: center;">
                    <div style="width: 100px; height: 10px; background-color: #ddd; margin-right: 10px;">
                      <div style="width: ${prediction.old_percentage}%; height: 100%; background-color: #3498db;"></div>
                    </div>
                    <span>${prediction.old_percentage}%</span>
                  </div>
                  <div style="display: flex; align-items: center; margin-top: 5px;">
                    <div style="width: 100px; height: 10px; background-color: #ddd; margin-right: 10px;">
                      <div style="width: ${prediction.new_percentage}%; height: 100%; background-color: #2ecc71;"></div>
                    </div>
                    <span>${prediction.new_percentage}%</span>
                  </div>
                  <p>Reason: ${prediction.reason}</p>
                </li>
              `).join('')}
            </ul>
          </div>
          <div style="margin-top: 10px;">
            <h3>Nutritional Analysis</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Question</th>
                  <th style="padding: 12px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Answer</th>
                </tr>
              </thead>
              <tbody>
                ${assessment.nutritional_analysis.questions_answers.map(qa => `
                  <tr>
                    <td style="padding: 12px; border: 1px solid #ddd;">${qa.question}</td>
                    <td style="padding: 12px; border: 1px solid #ddd;">${qa.answer}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 10px;">
            <h3>Recommendations</h3>
            <ul>
              ${assessment.recommendations.map(rec => `
                <li>${rec}</li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;

      if (Platform.OS === 'web') {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.innerHTML = htmlContent;
        document.body.appendChild(container);

        const waitForImages = () => {
          const images = container.getElementsByTagName('img');
          return Promise.all(
            Array.from(images).map((img) => {
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
          const canvas = await html2canvas(container);
          const imgData = canvas.toDataURL('image/png');

          const pdf = new jsPDF('p', 'pt', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

          // Add new pages if content exceeds one page
          let currentHeight = pdfHeight;
          while (currentHeight > pdf.internal.pageSize.getHeight()) {
            pdf.addPage();
            currentHeight -= pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, -currentHeight, pdfWidth, pdfHeight);
          }

        const userName = assessment.username.replace(/\s+/g, '').toLowerCase(); // Remove spaces and convert to lowercase
        pdf.save(`${userName}-assessment-report.pdf`);

        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        } finally {
          document.body.removeChild(container);
        }
      } else {
        try {
          const { uri } = await Print.printToFileAsync({ html: htmlContent });
          await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
          console.error('Error generating PDF:', error);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in handleExportUserPDF:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleSearch = () => {
    const filtered = assessments.filter(assessment =>
      assessment.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAssessments(filtered);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <LinearGradient colors={['#003C2C', '#005C3C']} style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
        <View style={styles.sidebarTop}>
          <TouchableOpacity style={styles.sidebarItem} onPress={toggleSidebar}>
            <FontAwesome name="bars" size={24} color="white" />
          </TouchableOpacity>
        </View>
        {!sidebarCollapsed && (
          <View style={styles.sidebarContent}>
            <Sidebar />
          </View>
        )}
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.header}>User Assessments</Text>
        <View style={styles.searchCreateContainer}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <Text style={styles.exportButtonText}>Export All PDF</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Assessments"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Assessment List */}
        <ScrollView contentContainerStyle={styles.assessmentGrid}>
  <View style={styles.tableContainer}>
    <View style={styles.tableHeader}>
      <Text style={styles.tableHeaderText}>User Name</Text>
      <Text style={styles.tableHeaderText}>Date</Text>
      <Text style={styles.tableHeaderText}>Export PDF</Text>
    </View>
    {filteredAssessments.map((item) => (
      <View style={styles.tableRow} key={item._id}>
        <View style={styles.tableCell}>
          <Text style={styles.tableCellText}>{item.username}</Text>
        </View>
        <View style={styles.tableCell}>
          <Text style={styles.tableCellText}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity style={[styles.tableCell, styles.exportButton]} onPress={() => handleExportUserPDF(item)}>
          <Text style={styles.exportButtonText}>Export PDF</Text>
        </TouchableOpacity>
      </View>
    ))}
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
    backgroundColor: '#F5F5F5',
  },
  sidebar: {
    width: '20%',
    backgroundColor: '#1A3B32',
    padding: 20,
  },
  sidebarCollapsed: {
    width: '5%',
  },
  sidebarItem: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarText: {
    color: '#F5F5F5',
    fontSize: 18,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchCreateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 15,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  assessmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tableContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center', // Ensures vertical centering
    paddingVertical: 15, // Maintain consistent height
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Ensures proper vertical alignment
  },
  tableCellText: {
    textAlign: 'center',
  },
  exportButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  exportButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
});

export default Assessments;
