package com.example.entity;

import com.baomidou.mybatisplus.extension.activerecord.Model;
import lombok.Data;

@Data
public class CustomerRep extends Model<CustomerRep> {
    private Long id;
    private String name;
    private Integer communityid;
    private Integer managerid;
    private String manangername;
    private String phone;
    private Integer finalmoney;
    private Integer constructionfund;
    private Integer receipt;
    private Integer remaining;

    public CustomerRep(Long id, String name, Integer communityid, Integer managerid, String manangername, String phone, Integer finalmoney, Integer constructionfund, Integer receipt, Integer remaining) {
        this.id = id;
        this.name = name;
        this.communityid = communityid;
        this.managerid = managerid;
        this.manangername = manangername;
        this.phone = phone;
        this.finalmoney = finalmoney;
        this.constructionfund = constructionfund;
        this.receipt = receipt;
        this.remaining = remaining;
    }

    public CustomerRep() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getCommunityid() {
        return communityid;
    }

    public void setCommunityid(Integer communityid) {
        this.communityid = communityid;
    }

    public Integer getManagerid() {
        return managerid;
    }

    public void setManagerid(Integer managerid) {
        this.managerid = managerid;
    }

    public String getManangername() {
        return manangername;
    }

    public void setManangername(String manangername) {
        this.manangername = manangername;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Integer getFinalmoney() {
        return finalmoney;
    }

    public void setFinalmoney(Integer finalmoney) {
        this.finalmoney = finalmoney;
    }

    public Integer getConstructionfund() {
        return constructionfund;
    }

    public void setConstructionfund(Integer constructionfund) {
        this.constructionfund = constructionfund;
    }

    public Integer getReceipt() {
        return receipt;
    }

    public void setReceipt(Integer receipt) {
        this.receipt = receipt;
    }

    public Integer getRemaining() {
        return remaining;
    }

    public void setRemaining(Integer remaining) {
        this.remaining = remaining;
    }
}
