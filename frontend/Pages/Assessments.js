import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal, Alert, Platform, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { readAssessments } from '../API/daily_assessment_api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  const [headerAnimation] = useState(new Animated.Value(0));

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
    
    // Animate header on mount
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
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

      // Create header content that will appear on each page
      const headerContent = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <img src="${logo1Base64}" alt="Logo 1" style="height: 60px; width: auto;">
          <div style="flex: 1; text-align: center; margin-top: 15px;">
            <h1 style="font-size: 18px; margin: 0; ">FUTUREPROOF: A Gamified AI Platform for Predictive Health and Preventive Wellness</h1>
            <h2 style="font-size: 16px; margin: 0; ">Embrace The Bear Within - Strong, Resilient, Future-Ready</h2>
            <br>
            <h2 style="font-size: 16px; margin: 0;">Daily Assessment Report</h2>
            <h4 style="font-size: 14px; margin: 5px 0 0;">${new Date().toLocaleDateString()}</h4>
          </div>
          <img src="${logo2Base64}" alt="Logo 2" style="height: 60px; width: auto;">
        </div>
      `;

      // Create first page with mission and vision
      const firstPageContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          
          <div style="margin-top: 20px;">
            <h3>Our Mission</h3>
            <p>FutureProof empowers individuals with AI-driven, gamified health insights for proactive well-being. By integrating genetic, lifestyle, and environmental data, we deliver personalized, preventive care solutions.</p>
            <h3>Our Vision</h3>
            <p>We envision a future where predictive healthcare transforms lives, making well-being accessible, engaging, and proactive through AI and gamification.</p>
          </div>
        </div>
      `;

      // Create assessment pages
      const assessmentPages = filteredAssessments.map((assessment, index) => {
        // User Information Page
        const userInfoPage = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 20px;">
              <h3>User Information - ${assessment.username}</h3>
              <h4>Page 1 of 4</h4>
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
          </div>
        `;

        // Prevention Progress Page
        const preventionPage = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 20px;">
              <h3>Prevention Progress - ${assessment.username}</h3>
              <h4>Page 2 of 4</h4>
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
          </div>
        `;

        // Nutritional Analysis Page
        const nutritionalPage = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 20px;">
              <h3>Nutritional Analysis - ${assessment.username}</h3>
              <h4>Page 3 of 4</h4>
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
          </div>
        `;

        // Recommendations Page
        const recommendationsPage = `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
            ${headerContent}
            
            <div style="margin-top: 10px;">
              <h3>Recommendations - ${assessment.username}</h4>
              <h4>Page 4 of 4</h4>
              <ul>
                ${assessment.recommendations.map(rec => `
                  <li>
                    <strong>Recommendation:</strong> ${rec.recommendation || 'N/A'}<br>
                    <strong>Scientific Basis:</strong> ${rec.basis || 'N/A'}<br>
                    <strong>Reference:</strong> ${rec.reference || 'N/A'}
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        `;

        return [userInfoPage, preventionPage, nutritionalPage, recommendationsPage];
      });

      // Flatten the array of arrays
      const allAssessmentPages = assessmentPages.flat();

      // Combine all pages with page breaks
      const allPages = [
        firstPageContent,
        ...allAssessmentPages
      ].join('<div style="page-break-after: always;"></div>');

      if (Platform.OS === 'web') {
        try {
          // For web platform - use jsPDF directly with separate pages
          const pdf = new jsPDF('p', 'pt', 'a4');
          
          // Function to add a page to the PDF
          const addPageToPdf = async (htmlContent, pageNum) => {
            const container = document.createElement('div');
            // Set a fixed width to match A4 dimensions (595.28pt is standard A4 width)
            container.style.width = '595.28pt';
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.innerHTML = htmlContent;
            document.body.appendChild(container);
            
            try {
              // Wait for images to load
              await Promise.all(
                Array.from(container.querySelectorAll('img')).map(img => {
                  if (img.complete) return Promise.resolve();
                  return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  });
                })
              );
              
              // Use a fixed scale to prevent zooming out
              const canvas = await html2canvas(container, {
                scale: 1.0,
                useCORS: true,
                logging: false
              });
              
              // Always use the full page width
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = pdf.internal.pageSize.getHeight();
              
              // Add new page if it's not the first page
              if (pageNum > 0) pdf.addPage();
              
              // Add image with proper sizing
              pdf.addImage(
                canvas.toDataURL('image/jpeg', 1.0), 
                'JPEG', 
                0, 0, 
                pdfWidth, 
                canvas.height * (pdfWidth / canvas.width)
              );
            } finally {
              document.body.removeChild(container);
            }
          };
          
          // Process each page
          const pages = [firstPageContent, ...allAssessmentPages];
          for (let i = 0; i < pages.length; i++) {
            await addPageToPdf(pages[i], i);
          }
          
          pdf.save('users-assessment-report.pdf');
        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      } else {
        // For mobile platforms
        try {
          const { uri } = await Print.printToFileAsync({ 
            html: allPages,
            base64: false,
            width: 612, // Standard 8.5" x 11" page width in points
            height: 792 // Standard 8.5" x 11" page height in points
          });
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

  const handleExportUserPDF = async (assessment) => {
    try {
      // Convert logo URLs to base64
      const logo1Base64 = await convertImageToBase64("https://i.ibb.co/GQygLXT9/tuplogo.png");
      const logo2Base64 = await convertImageToBase64("https://i.ibb.co/YBStKgFC/logo-2.png");

      // Create header content that will appear on each page
      const headerContent = `
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
      `;

      // Create first page with mission and vision
      const firstPageContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          
          <div style="margin-top: 10px;">
            <h3>Our Mission</h3>
            <p>FutureProof empowers individuals with AI-driven, gamified health insights for proactive well-being. By integrating genetic, lifestyle, and environmental data, we deliver personalized, preventive care solutions.</p>
            <h3>Our Vision</h3>
            <p>We envision a future where predictive healthcare transforms lives, making well-being accessible, engaging, and proactive through AI and gamification.</p>
          </div>
        </div>
      `;
      
      // User Information Page
      const userInfoPage = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          
          <div style="margin-top: 10px;">
            <h3>User Information - ${assessment.username}</h3>
            <h4>Page 1 of 4</h4>
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
        </div>
      `;

      // Prevention Progress Page
      const preventionPage = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          
          <div style="margin-top: 10px;">
            <h3>Prevention Progress - ${assessment.username}</h3>
            <h4>Page 2 of 4</h4>
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
        </div>
      `;

      // Nutritional Analysis Page
      const nutritionalPage = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          
          <div style="margin-top: 10px;">
            <h3>Nutritional Analysis - ${assessment.username}</h3>
            <h4>Page 3 of 4</h4>
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
        </div>
      `;

      // Recommendations Page
      const recommendationsPage = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; max-width: 900px; margin: 0 auto;">
          ${headerContent}
          
          <div style="margin-top: 10px;">
            <h3>Recommendations - ${assessment.username}</h3>
            <h4>Page 4 of 4</h4>
            <ul>
              ${assessment.recommendations.map(rec => `
                <li>
                  <strong>Recommendation:</strong> ${rec.recommendation || 'N/A'}<br>
                  <strong>Scientific Basis:</strong> ${rec.basis || 'N/A'}<br>
                  <strong>Reference:</strong> ${rec.reference || 'N/A'}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;

      // Combine all pages
      const allPages = [
        firstPageContent,
        userInfoPage,
        preventionPage,
        nutritionalPage,
        recommendationsPage
      ].join('<div style="page-break-after: always;"></div>');

      if (Platform.OS === 'web') {
        try {
          // For web platform - use jsPDF directly with separate pages
          const pdf = new jsPDF('p', 'pt', 'a4');
          
          // Function to add a page to the PDF
          const addPageToPdf = async (htmlContent, pageNum) => {
            const container = document.createElement('div');
            // Set a fixed width to match A4 dimensions
            container.style.width = '595.28pt';
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.innerHTML = htmlContent;
            document.body.appendChild(container);
            
            try {
              // Wait for images to load
              await Promise.all(
                Array.from(container.querySelectorAll('img')).map(img => {
                  if (img.complete) return Promise.resolve();
                  return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  });
                })
              );
              
              // Use a fixed scale to prevent zooming out
              const canvas = await html2canvas(container, {
                scale: 1.0,
                useCORS: true,
                logging: false
              });
              
              // Always use the full page width
              const pdfWidth = pdf.internal.pageSize.getWidth();
              
              // Add new page if it's not the first page
              if (pageNum > 0) pdf.addPage();
              
              // Add image with proper sizing
              pdf.addImage(
                canvas.toDataURL('image/jpeg', 1.0), 
                'JPEG', 
                0, 0, 
                pdfWidth, 
                canvas.height * (pdfWidth / canvas.width)
              );
            } finally {
              document.body.removeChild(container);
            }
          };
          
          // Process each page
          const pages = [firstPageContent, userInfoPage, preventionPage, nutritionalPage, recommendationsPage];
          for (let i = 0; i < pages.length; i++) {
            await addPageToPdf(pages[i], i);
          }
          
          const userName = assessment.username.replace(/\s+/g, '').toLowerCase();
          pdf.save(`${userName}-assessment-report.pdf`);
        } catch (err) {
          console.error('Error generating PDF:', err);
          Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        }
      } else {
        try {
          const { uri } = await Print.printToFileAsync({ 
            html: allPages,
            base64: false,
            width: 612,
            height: 792
          });
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
      assessment.username && assessment.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAssessments(filtered);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <View style={styles.container}>
      <Sidebar />
      <View style={styles.mainContent}>
        <Animated.View 
          style={[
            styles.pageHeader,
            {
              opacity: headerAnimation,
              transform: [{ translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0]
              })}]
            }
          ]}
        >
          <Text style={styles.pageTitle}>Assessments Management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleExportPDF}>
              <FontAwesome5 name="file-pdf" size={14} color="white" />
              <Text style={styles.actionButtonText}>Export All PDF</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search assessments by username..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <FontAwesome name="search" size={16} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.tableWrapper}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Username</Text>
              <Text style={[styles.tableHeaderText, {flex: 1}]}>Date</Text>
              <Text style={[styles.tableHeaderText, {flex: 0.8}]}>Actions</Text>
            </View>
            
            {filteredAssessments.map((item) => (
              <View style={styles.tableRow} key={item._id}>
                <Text style={[styles.tableCell, {flex: 1}]}>{item.username}</Text>
                <Text style={[styles.tableCell, {flex: 1}]}>{new Date(item.date).toLocaleDateString()}</Text>
                <View style={[styles.tableCell, styles.actionCell, {flex: 0.8}]}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.exportBtn]} 
                    onPress={() => handleExportUserPDF(item)}
                  >
                    <FontAwesome name="file-pdf-o" size={14} color="white" />
                    <Text style={styles.actionBtnText}>Export PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {filteredAssessments.length === 0 && (
              <View style={styles.emptyState}>
                <FontAwesome5 name="clipboard-list" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No assessments found</Text>
                <Text style={styles.emptyStateSubText}>Try a different search</Text>
              </View>
            )}
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
  // Modern Sidebar styles
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
  
  // Main content styles
  mainContent: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 10,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchBar: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 12,
    paddingLeft: 16,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#10B981',
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginLeft: 8,
  },
  
  // Table styles
  tableWrapper: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#4B5563',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#374151',
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionBtn: {
    width: 50,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  exportBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    width: 100 ,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  
  // Modal styles (in case needed in future)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 800,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  }
});

export default Assessments;

