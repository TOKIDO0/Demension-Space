package com.example.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import com.example.common.handler.ListHandler;
import lombok.Data;

import java.beans.Transient;

import java.util.List;

@Data
@TableName(value = "t_user", autoResultMap = true)
public class User extends Model<User> {
    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;
    private String newPassword;

    private String nickName;

    private String email;

    private String phone;

    private String avatar;
    private String address;
    private Integer age;

    private String question;
    private String answers;

    /**
     * 权限
     */
    @TableField(typeHandler = ListHandler.class)
    private List<Long> role;

    @TableField(exist = false)
    private List<Permission> permission;


    @TableField(exist = false)
    private List<Permission> permission1;
    @TableField(exist = false)
    private List<Permission> permission2;
    @TableField(exist = false)
    private List<Permission> permission3;
    @TableField(exist = false)
    private List<Permission> permission4;
    @TableField(exist = false)
    private List<Permission> permission5;
    @TableField(exist = false)
    private List<Permission> permission0;

    public User(Long id, String username, String password, String newPassword, String nickName, String email, String phone, String avatar, String address, Integer age, String question, String answers, List<Long> role, List<Permission> permission, List<Permission> permission1, List<Permission> permission2, List<Permission> permission3, List<Permission> permission4, List<Permission> permission5, List<Permission> permission0) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.newPassword = newPassword;
        this.nickName = nickName;
        this.email = email;
        this.phone = phone;
        this.avatar = avatar;
        this.address = address;
        this.age = age;
        this.question = question;
        this.answers = answers;
        this.role = role;
        this.permission = permission;
        this.permission1 = permission1;
        this.permission2 = permission2;
        this.permission3 = permission3;
        this.permission4 = permission4;
        this.permission5 = permission5;
        this.permission0 = permission0;
    }

    public User() {
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswers() {
        return answers;
    }

    public void setAnswers(String answers) {
        this.answers = answers;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getNickName() {
        return nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public List<Long> getRole() {
        return role;
    }

    public void setRole(List<Long> role) {
        this.role = role;
    }

    public List<Permission> getPermission() {
        return permission;
    }

    public void setPermission(List<Permission> permission) {
        this.permission = permission;
    }

    public List<Permission> getPermission2() {
        return permission2;
    }

    public void setPermission2(List<Permission> permission2) {
        this.permission2 = permission2;
    }

    public List<Permission> getPermission3() {
        return permission3;
    }

    public void setPermission3(List<Permission> permission3) {
        this.permission3 = permission3;
    }

    public List<Permission> getPermission4() {
        return permission4;
    }

    public void setPermission4(List<Permission> permission4) {
        this.permission4 = permission4;
    }

    public List<Permission> getPermission1() {
        return permission1;
    }

    public void setPermission1(List<Permission> permission1) {
        this.permission1 = permission1;
    }

    public List<Permission> getPermission5() {
        return permission5;
    }

    public void setPermission5(List<Permission> permission5) {
        this.permission5 = permission5;
    }

    public List<Permission> getPermission0() {
        return permission0;
    }

    public void setPermission0(List<Permission> permission0) {
        this.permission0 = permission0;
    }
}
